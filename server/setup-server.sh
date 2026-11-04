#!/bin/bash
# Скрипт установки генератора ИИ-комментариев на сервер
# Запускать на сервере: bash setup-server.sh
# Перед запуском добавить ANTHROPIC_API_KEY в .env файл сервера

set -e

SERVER_DIR="/opt/ispoved/server"
echo "=== Настройка генератора ИИ-комментариев ==="

# Создаём папку для данных
mkdir -p "$SERVER_DIR/data"
echo "✓ Папка $SERVER_DIR/data создана"

# Устанавливаем зависимости (Anthropic SDK)
cd "$SERVER_DIR"
npm install
echo "✓ Зависимости установлены"

# Первый запуск генерации
echo ""
echo "=== Первый запуск генерации (займёт несколько минут) ==="
node generate-summaries.js

echo ""
echo "=== Настройка cron (раз в неделю, воскресенье в 3:00) ==="
CRON_CMD="0 3 * * 0 cd $SERVER_DIR && node generate-summaries.js >> /var/log/ispoved-summaries.log 2>&1"

# Добавляем задачу в crontab если её ещё нет
( crontab -l 2>/dev/null | grep -v 'generate-summaries' ; echo "$CRON_CMD" ) | crontab -
echo "✓ Cron задача добавлена"

echo ""
echo "=== Готово! ==="
echo "• summaries.json: $SERVER_DIR/data/summaries.json"
echo "• Эндпоинт: http://$(hostname -I | awk '{print $1}'):3000/summaries.json"
echo "• Лог cron: /var/log/ispoved-summaries.log"
echo "• Обновляется каждое воскресенье в 3:00"
