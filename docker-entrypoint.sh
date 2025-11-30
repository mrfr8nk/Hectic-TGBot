#!/bin/bash
set -e

echo "🚀 Starting Telegram Bot API Server"
echo "📱 API ID: ${TELEGRAM_API_ID}"
echo "🔐 Hash: ${TELEGRAM_API_HASH:0:10}..."
echo "📂 Working Directory: /var/lib/telegram-bot-api"

exec telegram-bot-api \
  --api-id="$TELEGRAM_API_ID" \
  --api-hash="$TELEGRAM_API_HASH" \
  --dir=/var/lib/telegram-bot-api \
  --local \
  --http-port=8081
