"""
Telegram Bot для приветствия пользователей.

Все управление контентом (фильмы, эпизоды, каналы, статистика, настройки)
теперь выполняется через веб-админку приложения. Бот работает автономно
и не подключается к базе данных.

Требования: pip install python-telegram-bot==20.*

Переменные окружения:
  BOT_TOKEN  — токен от @BotFather
  APP_URL    — (необязательно) ссылка на ваше веб-приложение,
               будет показана пользователю в /start

Запуск: python telegram_bot.py
"""

import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, ContextTypes,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── Config ───────────────────────────────────────────────────
BOT_TOKEN = os.environ["BOT_TOKEN"]
APP_URL = os.environ.get("APP_URL", "").strip()


# ─── /start ──────────────────────────────────────────────────

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    text = (
        f"Привет, {user.first_name}! 🎬\n\n"
        "Добро пожаловать! Все фильмы и сериалы доступны в нашем приложении."
    )

    keyboard = []
    if APP_URL:
        keyboard.append([InlineKeyboardButton("🎬 Открыть приложение", url=APP_URL)])

    reply_markup = InlineKeyboardMarkup(keyboard) if keyboard else None
    await update.message.reply_text(text, reply_markup=reply_markup)


# ─── /help ───────────────────────────────────────────────────

async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "ℹ️ *Помощь*\n\n"
        "Все фильмы, сериалы и магазин доступны в нашем приложении.\n"
        "Управление контентом ведётся через веб-админку."
    )
    await update.message.reply_text(text, parse_mode="Markdown")


# ─── Main ────────────────────────────────────────────────────

def main():
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(CommandHandler("help", help_handler))

    logger.info("🤖 Bot started!")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
