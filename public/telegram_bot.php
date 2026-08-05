<?php
/**
 * Telegram → MP4 бот (PHP)
 * ------------------------------------------------------------------
 * Кор чӣ хел мекунад:
 *   1. Шумо видеоро ба бот (ё ба канале, ки бот админ аст) мефиристед.
 *   2. Бот файлро аз Telegram мегирад ва дар сервери шумо (папкаи /videos)
 *      захира мекунад.
 *   3. Бот ба шумо линки тайёри MP4-ро мефиристад.
 *   4. Шумо он линкро дар админ-панели барнома ба серия мегузоред.
 *
 * ⚠ МУҲИМ — маҳдудияти Telegram:
 *   Bot API-и оддӣ (api.telegram.org) танҳо файлҳои то 20 МБ медиҳад.
 *   Барои файлҳои то 2 ГБ бояд «Local Bot API server»-ро дар сервери
 *   худатон гузоред ва API_BASE-ро ба он равона кунед.
 *   Файлҳои аз 2 ГБ калон — Telegram ба бот тамоман намедиҳад.
 *   Барои 3 ГБ филмҳо: аввал бо ffmpeg сиқиш кунед (поён мисол ҳаст).
 *
 * Насб:
 *   php -S 0.0.0.0:8000   (ё Apache/Nginx)
 *   Webhook:
 *     curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://domain.tld/telegram_bot.php"
 */

// ─── Танзимот ───────────────────────────────────────────────────
$BOT_TOKEN  = getenv('BOT_TOKEN') ?: 'ТОКЕНИ_ХУДРО_ИНҶО_ГУЗОРЕД';

// Bot API-и оддӣ (то 20 МБ):
$API_BASE   = 'https://api.telegram.org';
// Local Bot API server (то 2 ГБ) — агар доред, инро фаъол кунед:
// $API_BASE = 'http://127.0.0.1:8081';

$PUBLIC_URL = getenv('PUBLIC_URL') ?: 'https://domain.tld'; // домени сервери шумо
$SAVE_DIR   = __DIR__ . '/videos';                          // папкаи захира
$ADMIN_IDS  = [];                                           // масалан: [123456789]

if (!is_dir($SAVE_DIR)) mkdir($SAVE_DIR, 0775, true);

// ─── Ёрирасонҳо ────────────────────────────────────────────────
function api(string $method, array $params = []) {
    global $BOT_TOKEN, $API_BASE;
    $ch = curl_init("$API_BASE/bot$BOT_TOKEN/$method");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $params,
        CURLOPT_TIMEOUT        => 60,
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true);
}

function reply(int $chatId, string $text): void {
    api('sendMessage', ['chat_id' => $chatId, 'text' => $text, 'parse_mode' => 'HTML']);
}

function slugify(string $name): string {
    $name = preg_replace('/[^A-Za-z0-9._-]+/', '_', $name);
    return trim($name, '_') ?: 'video';
}

// ─── Гирифтани update ──────────────────────────────────────────
$raw    = file_get_contents('php://input');
$update = json_decode($raw, true);
if (!$update) { http_response_code(200); echo 'ok'; exit; }

$msg = $update['message'] ?? $update['channel_post'] ?? null;
if (!$msg) { echo 'ok'; exit; }

$chatId = $msg['chat']['id'];
$fromId = $msg['from']['id'] ?? null;

// Танҳо админҳо (агар рӯйхат холӣ набошад)
if ($ADMIN_IDS && $fromId && !in_array($fromId, $ADMIN_IDS, true)) {
    reply($chatId, '⛔️ Шумо иҷозат надоред.');
    exit;
}

// ─── /start ────────────────────────────────────────────────────
if (isset($msg['text']) && str_starts_with($msg['text'], '/start')) {
    reply($chatId, "🎬 Салом!\n\nВидеоро ба ман фиристед — ман онро дар сервер захира мекунам ва линки MP4 медиҳам.\nОн линкро дар админ-панели барнома ба серия гузоред.");
    exit;
}

// ─── Гирифтани видео/файл ──────────────────────────────────────
$file = $msg['video'] ?? $msg['document'] ?? null;
if (!$file) { echo 'ok'; exit; }

$fileId   = $file['file_id'];
$fileSize = $file['file_size'] ?? 0;
$origName = $file['file_name'] ?? ($fileId . '.mp4');

reply($chatId, "⏳ Мегирам… (" . round($fileSize / 1048576, 1) . " МБ)");

// 1) file_path гирифтан
$info = api('getFile', ['file_id' => $fileId]);
if (empty($info['ok'])) {
    reply($chatId, "❌ Хатогӣ: " . ($info['description'] ?? 'номаълум') .
        "\n\nАгар «file is too big» бошад — Local Bot API server лозим аст.");
    exit;
}
$filePath = $info['result']['file_path'];

// 2) Зеркашӣ (stream — хотираро пур намекунад)
$target = $SAVE_DIR . '/' . slugify(pathinfo($origName, PATHINFO_FILENAME)) . '_' . substr(md5($fileId), 0, 8) . '.mp4';

if (str_starts_with($filePath, '/')) {
    // Local Bot API server — файл аллакай дар диски сервер аст
    copy($filePath, $target);
} else {
    $url = "$API_BASE/file/bot$BOT_TOKEN/$filePath";
    $in  = fopen($url, 'rb');
    $out = fopen($target, 'wb');
    if (!$in || !$out) { reply($chatId, '❌ Файлро кушода натавонистам.'); exit; }
    stream_copy_to_stream($in, $out);
    fclose($in); fclose($out);
}

$link = rtrim($PUBLIC_URL, '/') . '/videos/' . basename($target);
reply($chatId, "✅ Тайёр!\n\n<b>Линки MP4:</b>\n<code>$link</code>\n\nИнро дар админ-панел → Серия → «Видео URL» гузоред.");

echo 'ok';

/* ──────────────────────────────────────────────────────────────
 * Барои филмҳои 3 ГБ — пеш аз фиристодан сиқиш кунед:
 *
 *   ffmpeg -i film.mkv -vf scale=-2:720 -c:v libx264 -crf 26 \
 *          -preset veryfast -c:a aac -b:a 128k film_720p.mp4
 *
 * 3 ГБ → тақрибан 700–900 МБ мешавад, сифат хуб мемонад.
 * ──────────────────────────────────────────────────────────── */
