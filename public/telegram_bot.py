"""
Telegram Bot для раздачи фильмов.
Требования: pip install python-telegram-bot==20.* supabase httpx

Переменные окружения:
  BOT_TOKEN         — токен от @BotFather
  SUPABASE_URL      — URL вашего Supabase проекта
  SUPABASE_KEY      — service_role ключ Supabase
  ADMIN_IDS         — ID администраторов через запятую (например: 123456789,987654321)

Запуск: python telegram_bot.py
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta
from telegram import (
    Update, InlineKeyboardButton, InlineKeyboardMarkup,
    ChatMember, BotCommand
)
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    CallbackQueryHandler, ContextTypes, filters
)
from supabase import create_client, Client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Config ───────────────────────────────────────────────────
BOT_TOKEN = os.environ["BOT_TOKEN"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
ADMIN_IDS = [int(x.strip()) for x in os.environ.get("ADMIN_IDS", "").split(",") if x.strip()]

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── Helpers ──────────────────────────────────────────────────

def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS


def get_setting(key: str, default: str = "") -> str:
    res = sb.table("bot_settings").select("value").eq("key", key).single().execute()
    return res.data["value"] if res.data else default


def get_channels():
    res = sb.table("bot_channels").select("*").eq("is_active", True).order("sort_order").execute()
    return res.data or []


def get_copy_protection() -> bool:
    return get_setting("copy_protection", "true") == "true"


def get_auto_delete_hours() -> int:
    return int(get_setting("auto_delete_hours", "1"))


async def check_subscription(bot, user_id: int) -> tuple[bool, list]:
    """Проверяет подписку пользователя на все активные каналы."""
    channels = get_channels()
    not_subscribed = []

    for ch in channels:
        try:
            member = await bot.get_chat_member(chat_id=ch["chat_id"], user_id=user_id)
            if member.status in [ChatMember.LEFT, ChatMember.BANNED]:
                not_subscribed.append(ch)
        except Exception:
            not_subscribed.append(ch)

    return len(not_subscribed) == 0, not_subscribed


def log_stat(telegram_user_id: str, username: str, action: str, movie_id: str = None):
    data = {
        "telegram_user_id": telegram_user_id,
        "telegram_username": username or "",
        "action": action,
    }
    if movie_id:
        data["movie_id"] = movie_id
    try:
        sb.table("bot_stats").insert(data).execute()
    except Exception as e:
        logger.error(f"Stats error: {e}")


# ─── Scheduled deletion ──────────────────────────────────────

async def schedule_delete(context: ContextTypes.DEFAULT_TYPE, chat_id: int, message_id: int, hours: int):
    """Удаляет сообщение через N часов."""
    await asyncio.sleep(hours * 3600)
    try:
        await context.bot.delete_message(chat_id=chat_id, message_id=message_id)
    except Exception as e:
        logger.error(f"Delete error: {e}")


# ─── /start ──────────────────────────────────────────────────

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    args = context.args
    user = update.effective_user

    if args and args[0].startswith("movie_"):
        movie_id = args[0].replace("movie_", "")
        context.user_data["pending_movie_id"] = movie_id
        # Проверяем подписку
        subscribed, missing = await check_subscription(context.bot, user.id)
        if not subscribed:
            buttons = []
            for ch in missing:
                link = ch.get("invite_link") or (f"https://t.me/{ch['username']}" if ch.get("username") else None)
                if link:
                    buttons.append([InlineKeyboardButton(f"📢 {ch['title']}", url=link)])
            buttons.append([InlineKeyboardButton("✅ Проверить подписку", callback_data=f"check_sub")])
            await update.message.reply_text(
                "❗ Для получения фильма подпишитесь на наши каналы:",
                reply_markup=InlineKeyboardMarkup(buttons)
            )
            log_stat(str(user.id), user.username, "subscribe_check", movie_id)
            return

        await send_movie(update, context, movie_id)
        return

    # Обычный старт
    keyboard = [[InlineKeyboardButton("🔍 Фильм / Сериал", callback_data="search_movie")]]
    await update.message.reply_text(
        f"Привет, {user.first_name}! 🎬\n\nЯ бот для просмотра фильмов.\nНажмите кнопку ниже для поиска:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )
    log_stat(str(user.id), user.username, "start")


async def send_movie(update: Update, context: ContextTypes.DEFAULT_TYPE, movie_id: str):
    user = update.effective_user
    chat_id = update.effective_chat.id

    # Получаем эпизоды фильма
    res = sb.table("episodes").select("*").eq("movie_id", movie_id).order("part_number").execute()
    episodes = res.data or []

    movie_res = sb.table("movies").select("title, description, poster").eq("id", movie_id).single().execute()
    movie = movie_res.data

    if not movie:
        msg = update.message or update.callback_query.message
        await msg.reply_text("❌ Фильм не найден.")
        return

    copy_protection = get_copy_protection()
    hours = get_auto_delete_hours()

    # Отправляем информацию о фильме
    caption = f"🎬 *{movie['title']}*\n\n{movie.get('description', '')}"

    if movie.get("poster"):
        sent = await context.bot.send_photo(
            chat_id=chat_id,
            photo=movie["poster"],
            caption=caption,
            parse_mode="Markdown",
            protect_content=copy_protection
        )
    else:
        sent = await context.bot.send_message(
            chat_id=chat_id,
            text=caption,
            parse_mode="Markdown",
            protect_content=copy_protection
        )

    # Планируем удаление
    asyncio.create_task(schedule_delete(context, chat_id, sent.message_id, hours))

    # Отправляем эпизоды
    for ep in episodes:
        if ep.get("video_url"):
            ep_text = f"📺 Часть {ep['part_number']}: {ep['title']}"
            if ep.get("duration"):
                ep_text += f" ({ep['duration']})"
            ep_msg = await context.bot.send_message(
                chat_id=chat_id,
                text=f"{ep_text}\n\n🔗 {ep['video_url']}",
                protect_content=copy_protection
            )
            asyncio.create_task(schedule_delete(context, chat_id, ep_msg.message_id, hours))

    log_stat(str(user.id), user.username, "view", movie_id)


# ─── Callback: check subscription ────────────────────────────

async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user = query.from_user

    if query.data == "check_sub":
        subscribed, missing = await check_subscription(context.bot, user.id)
        if subscribed:
            movie_id = context.user_data.get("pending_movie_id")
            if movie_id:
                await query.message.delete()
                await send_movie(update, context, movie_id)
            else:
                await query.message.edit_text("✅ Вы подписаны! Используйте ссылку на фильм снова.")
        else:
            buttons = []
            for ch in missing:
                link = ch.get("invite_link") or (f"https://t.me/{ch['username']}" if ch.get("username") else None)
                if link:
                    buttons.append([InlineKeyboardButton(f"📢 {ch['title']}", url=link)])
            buttons.append([InlineKeyboardButton("✅ Проверить подписку", callback_data="check_sub")])
            await query.message.edit_text(
                "❌ Вы не подписаны на все каналы.\nПодпишитесь и нажмите «Проверить» снова:",
                reply_markup=InlineKeyboardMarkup(buttons)
            )

    elif query.data == "search_movie":
        await query.message.edit_text(
            "🔍 Отправьте название фильма или сериала для поиска:"
        )
        context.user_data["awaiting_search"] = True

    # ─── Admin callbacks ───
    elif query.data == "admin_add_channel":
        if not is_admin(user.id):
            return
        buttons = [
            [InlineKeyboardButton("📢 Публичный канал", callback_data="add_ch_public")],
            [InlineKeyboardButton("🔒 Частный канал", callback_data="add_ch_private")],
            [InlineKeyboardButton("📝 Частный с заявкой", callback_data="add_ch_private_request")],
        ]
        await query.message.edit_text(
            "Выберите тип канала:",
            reply_markup=InlineKeyboardMarkup(buttons)
        )

    elif query.data.startswith("add_ch_"):
        if not is_admin(user.id):
            return
        ch_type = query.data.replace("add_ch_", "")
        context.user_data["adding_channel_type"] = ch_type
        await query.message.edit_text(
            f"Тип: *{ch_type}*\n\n"
            "Отправьте данные канала в формате:\n"
            "`название | chat_id | @username | invite_link`\n\n"
            "Пример:\n`Мой канал | -1001234567890 | @mychannel | https://t.me/+abc123`",
            parse_mode="Markdown"
        )

    elif query.data == "admin_del_channel":
        if not is_admin(user.id):
            return
        channels = get_channels()
        if not channels:
            await query.message.edit_text("Нет активных каналов.")
            return
        buttons = [
            [InlineKeyboardButton(f"❌ {ch['title']}", callback_data=f"del_ch_{ch['id']}")]
            for ch in channels
        ]
        await query.message.edit_text("Выберите канал для удаления:", reply_markup=InlineKeyboardMarkup(buttons))

    elif query.data.startswith("del_ch_"):
        if not is_admin(user.id):
            return
        ch_id = query.data.replace("del_ch_", "")
        sb.table("bot_channels").delete().eq("id", ch_id).execute()
        await query.message.edit_text("✅ Канал удалён!")

    elif query.data == "admin_copy_on":
        if not is_admin(user.id):
            return
        sb.table("bot_settings").update({"value": "false"}).eq("key", "copy_protection").execute()
        await query.message.edit_text("🔓 Защита от копирования *отключена*.", parse_mode="Markdown")

    elif query.data == "admin_copy_off":
        if not is_admin(user.id):
            return
        sb.table("bot_settings").update({"value": "true"}).eq("key", "copy_protection").execute()
        await query.message.edit_text("🔒 Защита от копирования *включена*.", parse_mode="Markdown")

    # ─── Add episode: list movies ───
    elif query.data == "admin_add_episode":
        if not is_admin(user.id):
            return
        res = sb.table("movies").select("id, title, year").order("created_at", desc=True).limit(20).execute()
        movies = res.data or []
        if not movies:
            await query.message.edit_text("❌ Нет фильмов в базе.")
            return
        buttons = [
            [InlineKeyboardButton(f"🎬 {m['title']} ({m['year']})", callback_data=f"ep_movie_{m['id']}")]
            for m in movies
        ]
        await query.message.edit_text("Выберите фильм для добавления эпизода:", reply_markup=InlineKeyboardMarkup(buttons))

    elif query.data.startswith("ep_movie_"):
        if not is_admin(user.id):
            return
        movie_id = query.data.replace("ep_movie_", "")
        context.user_data["adding_episode_movie_id"] = movie_id
        # Count existing episodes
        ep_res = sb.table("episodes").select("id", count="exact").eq("movie_id", movie_id).execute()
        ep_count = ep_res.count or 0
        movie_res = sb.table("movies").select("title").eq("id", movie_id).single().execute()
        movie_title = movie_res.data["title"] if movie_res.data else "—"
        context.user_data["adding_episode_next_part"] = ep_count + 1
        await query.message.edit_text(
            f"🎬 *{movie_title}*\n"
            f"📺 Частей сейчас: *{ep_count}*\n\n"
            f"Отправьте ссылки на новые части — каждая ссылка на отдельной строке.\n"
            f"Нумерация начнётся с *{ep_count + 1}*.\n\n"
            f"Или отправьте в формате:\n`название | ссылка | длительность`\n"
            f"(длительность необязательна)",
            parse_mode="Markdown"
        )


# ─── Text handler (search + add channel) ─────────────────────

async def text_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    text = update.message.text.strip()

    # Admin adding channel
    if is_admin(user.id) and context.user_data.get("adding_channel_type"):
        ch_type = context.user_data.pop("adding_channel_type")
        parts = [p.strip() for p in text.split("|")]
        if len(parts) < 2:
            await update.message.reply_text("❌ Неверный формат. Нужно: `название | chat_id | @username | invite_link`", parse_mode="Markdown")
            return
        title = parts[0]
        chat_id = parts[1]
        username = parts[2] if len(parts) > 2 else None
        invite_link = parts[3] if len(parts) > 3 else None
        sb.table("bot_channels").insert({
            "title": title,
            "chat_id": chat_id,
            "username": username,
            "invite_link": invite_link,
            "channel_type": ch_type,
        }).execute()
        await update.message.reply_text(f"✅ Канал «{title}» добавлен (тип: {ch_type})!")
        return

    # Search
    if context.user_data.get("awaiting_search"):
        context.user_data["awaiting_search"] = False
        res = sb.table("movies").select("id, title, year, poster").ilike("title", f"%{text}%").limit(10).execute()
        movies = res.data or []
        if not movies:
            await update.message.reply_text("🔍 Ничего не найдено. Попробуйте другое название.")
            return
        buttons = [
            [InlineKeyboardButton(f"🎬 {m['title']} ({m['year']})", url=f"https://t.me/{(await context.bot.get_me()).username}?start=movie_{m['id']}")]
            for m in movies
        ]
        await update.message.reply_text("Результаты поиска:", reply_markup=InlineKeyboardMarkup(buttons))
        log_stat(str(user.id), user.username, "search")
        return


# ─── Admin: forward movie to get link ────────────────────────

async def forward_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Когда админ пересылает контент, бот ищет фильм и дает ссылку."""
    user = update.effective_user
    if not is_admin(user.id):
        return

    # Если это текст с названием фильма — ищем
    text = update.message.text or update.message.caption or ""
    if text:
        res = sb.table("movies").select("id, title").ilike("title", f"%{text.strip()}%").limit(5).execute()
        movies = res.data or []
        if movies:
            bot_info = await context.bot.get_me()
            lines = ["🔗 Ссылки на фильмы:\n"]
            for m in movies:
                link = f"https://t.me/{bot_info.username}?start=movie_{m['id']}"
                lines.append(f"• {m['title']}: `{link}`")
            await update.message.reply_text("\n".join(lines), parse_mode="Markdown")
            return

    await update.message.reply_text("Отправьте название фильма, чтобы получить ссылку.")


# ─── /admin command ──────────────────────────────────────────

async def admin_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_admin(user.id):
        await update.message.reply_text("⛔ Нет доступа.")
        return

    copy_status = "🔒 Вкл" if get_copy_protection() else "🔓 Выкл"
    channels = get_channels()
    ch_count = len(channels)

    buttons = [
        [InlineKeyboardButton("➕ Доб. канал", callback_data="admin_add_channel")],
        [InlineKeyboardButton("❌ Удалить канал", callback_data="admin_del_channel")],
        [InlineKeyboardButton("🔓 Открыть копировать", callback_data="admin_copy_on")],
        [InlineKeyboardButton("🔒 Закрыть копировать", callback_data="admin_copy_off")],
    ]

    text = (
        f"⚙️ *Панель администратора*\n\n"
        f"📢 Каналов: {ch_count}\n"
        f"📋 Защита: {copy_status}\n"
        f"⏰ Авто-удаление: {get_auto_delete_hours()} ч."
    )

    await update.message.reply_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(buttons))


# ─── /link command — get link for movie ──────────────────────

async def link_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Админ отправляет /link название — получает ссылку"""
    user = update.effective_user
    if not is_admin(user.id):
        return

    query = " ".join(context.args) if context.args else ""
    if not query:
        await update.message.reply_text("Использование: `/link название фильма`", parse_mode="Markdown")
        return

    res = sb.table("movies").select("id, title").ilike("title", f"%{query}%").limit(10).execute()
    movies = res.data or []

    if not movies:
        await update.message.reply_text("❌ Фильм не найден.")
        return

    bot_info = await context.bot.get_me()
    lines = []
    for m in movies:
        link = f"https://t.me/{bot_info.username}?start=movie_{m['id']}"
        lines.append(f"🎬 *{m['title']}*\n`{link}`")

    await update.message.reply_text("\n\n".join(lines), parse_mode="Markdown")


# ─── Main ────────────────────────────────────────────────────

def main():
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(CommandHandler("admin", admin_handler))
    app.add_handler(CommandHandler("link", link_handler))
    app.add_handler(CallbackQueryHandler(callback_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, text_handler))

    logger.info("🤖 Bot started!")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
