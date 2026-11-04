# Сервер «Исповеди»

Отдаёт приложению ИИ-комментарии к чтениям дня и принимает уведомления ЮKassa.

## Требования

- Node.js >= 18
- npm

## Быстрый старт

```bash
cd server
npm install
node generate-summaries.js   # заполнить data/summaries.json
node server.js               # или npm start / npm run dev
```

Переменные окружения читаются из `.env` (пример — в корне проекта, `.env.example`).

## Эндпоинты

### `GET /summaries.json`

Комментарии к чтениям дня. Формат — объект по датам:

```json
{
  "2026-11-04": {
    "feast": { "name": "Празднование Казанской иконе Божией Матери" },
    "readings": [
      { "ref": "Лк.1:39", "summary": "Краткое содержание отрывка" }
    ]
  }
}
```

Кэшируется на 24 часа (`Cache-Control: public, max-age=86400`).

### `GET /health`

```json
{ "status": "ok", "timestamp": "2026-11-04T12:00:00.000Z" }
```

### `POST /v1/webhook`

Уведомления ЮKassa. Обрабатывается событие `payment.succeeded`.

Защита:
- источник проверяется по официальным IP-диапазонам ЮKassa
  (`YOOKASSA_ALLOWED_IPS`, по умолчанию — список из документации);
- если задан `YOOKASSA_WEBHOOK_SECRET`, дополнительно проверяется заголовок
  `X-Webhook-Secret` (имеет смысл только за прокси).

Ответы: `200` — принято, `400` — некорректный JSON, `403` — чужой IP/секрет.

> ЮKassa не подписывает HTTP-уведомления HMAC-подписью — рекомендуемый способ
> проверки подлинности — allowlist IP. Старый заголовок `X-Yookassa-Signature`
> больше не используется.

### `GET /v1/payments?limit=10`

Журнал успешных платежей (последние `limit` записей, максимум 100).

Требует `Authorization: Bearer <ADMIN_TOKEN>`. Если `ADMIN_TOKEN` не задан,
эндпоинт отключён и отвечает `404`.

## Переменные окружения

```env
PORT=3000
NODE_ENV=production

# Админ-токен для /v1/payments. Если не задан — эндпоинт отключён (404).
ADMIN_TOKEN=

# Необязательно: дополнительный секрет для вебхука (заголовок X-Webhook-Secret).
YOOKASSA_WEBHOOK_SECRET=

# Необязательно: переопределить список разрешённых IP/CIDR ЮKassa.
YOOKASSA_ALLOWED_IPS=185.71.76.0/27,185.71.77.0/27,77.75.153.0/25,77.75.156.11/32,77.75.156.35/32,77.75.154.128/25

# Если сервер за nginx — доверять X-Forwarded-For
TRUST_PROXY=1

# Необязательно: HTTPS напрямую, без reverse-proxy
SSL_KEY_PATH=/etc/letsencrypt/live/ispoved.app/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/ispoved.app/fullchain.pem
```

## Логирование

Успешные платежи пишутся в `logs/payments.log` (или `LOG_FILE_PATH`) по одной
JSON-записи на строку:

```json
{
  "timestamp": "2026-11-04T12:00:00.000Z",
  "status": "Успешно",
  "payment_id": "...",
  "amount": { "value": "100.00", "currency": "RUB" },
  "description": "Пожертвование на развитие приложения «Исповедь»",
  "metadata": {},
  "payment_method": { "type": "bank_card", "card": { "last4": "4444" } },
  "created_at": "...",
  "captured_at": "..."
}
```

## Настройка ЮKassa

1. Личный кабинет → **Настройки** → **HTTP-уведомления**.
2. URL: `https://ispoved.app/v1/webhook`.
3. Событие: `payment.succeeded`.
4. Проверьте, что запросы приходят с IP из официального списка.

## HTTPS (обязательно для production)

Приложение сейчас обращается к `http://82.146.34.140:3000/summaries.json`.
Пока используется HTTP, ответ сервера можно подменить в публичной сети.
Порядок переезда:

1. Направить A-запись домена (например, `ispoved.app`) на `82.146.34.140`.
2. Выпустить сертификат:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d ispoved.app
   ```
3. Поставить nginx перед Node (пример — `nginx-ispoved.conf.example`).
4. В `.env` приложения указать:
   ```env
   VITE_SUMMARIES_URL=https://ispoved.app/summaries.json
   ```
5. Удалить исключение cleartext из
   `android/app/src/main/res/xml/network_security_config.xml`.
6. Пересобрать приложение: `npm run build`.

## Деплой (systemd)

```ini
[Unit]
Description=Ispoved backend
After=network.target

[Service]
WorkingDirectory=/opt/ispoved/server
ExecStart=/usr/bin/node server.js
Restart=always
EnvironmentFile=/opt/ispoved/server/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now ispoved
```

## Проверка

```bash
curl http://localhost:3000/health
curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3000/v1/payments

# Локальный вебхук будет отклонён (IP не из ЮKassa) — это ожидаемо:
curl -X POST http://localhost:3000/v1/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.succeeded","object":{"id":"test123"}}'
```

Для отладки вебхука на своей машине можно временно добавить `127.0.0.1/32`
в `YOOKASSA_ALLOWED_IPS`.

## Структура

```
server/
├── server.js                    # HTTP-сервер
├── generate-summaries.js        # генерация комментариев (Anthropic API)
├── setup-server.sh              # установка на сервер + cron
├── nginx-ispoved.conf.example   # пример HTTPS-прокси
├── data/summaries.json          # результат генерации
└── logs/payments.log            # журнал платежей
```
