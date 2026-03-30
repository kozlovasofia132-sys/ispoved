# YooKassa Webhook Server

Сервер для обработки webhook-уведомлений от ЮKassa в приложении "Исповедь".

## 📋 Требования

- Node.js >= 18.0.0
- npm или yarn

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd server
npm install
```

### 2. Настройка переменных окружения

Скопируйте файл `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
```

Откройте `.env` и укажите:

```env
# Секретный ключ для проверки подписи webhook
# Получите в личном кабинете ЮKassa в настройках HTTP-уведомлений
YOOKASSA_WEBHOOK_SECRET=your_actual_secret_key_here

# Порт сервера
PORT=3000

# Окружение (development/production)
NODE_ENV=development

# Путь к файлу логов
LOG_FILE_PATH=./logs/payments.log
```

### 3. Запуск сервера

**Режим разработки (с авто-перезагрузкой):**
```bash
npm run dev
```

**Продакшен режим:**
```bash
npm start
```

## 📡 Webhook Endpoint

### POST /v1/webhook

Обрабатывает уведомления от ЮKassa.

**Заголовок:**
- `X-Yookassa-Signature` - подпись запроса

**Тело запроса:**
```json
{
  "event": "payment.succeeded",
  "object": {
    "id": "2d3df78f-000e-500b-9000-1e7c9a9b0e0e",
    "status": "succeeded",
    "amount": {
      "value": "100.00",
      "currency": "RUB"
    },
    "description": "Пожертвование на приложение Исповедь",
    "metadata": {
      "user_id": "12345",
      "campaign": "donation"
    },
    ...
  }
}
```

**Ответ:**
- `200 OK` - уведомление получено и обработано
- `401 Unauthorized` - отсутствует подпись
- `403 Forbidden` - неверная подпись

## 🔐 Проверка подписи

Сервер автоматически проверяет подпись каждого запроса используя HMAC-SHA256.

**Алгоритм:**
1. Получает подпись из заголовка `X-Yookassa-Signature`
2. Вычисляет HMAC-SHA256 от тела запроса с секретным ключом
3. Сравнивает подписи используя constant-time comparison

## 📝 Логирование

Все успешные платежи записываются в лог-файл (по умолчанию `./logs/payments.log`).

**Формат записи:**
```json
{
  "timestamp": "2026-03-29T12:00:00.000Z",
  "status": "Успешно",
  "payment_id": "2d3df78f-000e-500b-9000-1e7c9a9b0e0e",
  "amount": {
    "value": "100.00",
    "currency": "RUB"
  },
  "description": "Пожертвование на приложение Исповедь",
  "metadata": {...},
  "payment_method": {...},
  "created_at": "2026-03-29T12:00:00.000Z",
  "captured_at": "2026-03-29T12:00:01.000Z"
}
```

## 📊 API для получения платежей

### GET /v1/payments

Получить список успешных платежей.

**Параметры:**
- `limit` (опционально) - количество записей (по умолчанию 10)

**Ответ:**
```json
{
  "payments": [...],
  "total": 150
}
```

### GET /health

Проверка работоспособности сервера.

**Ответ:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-29T12:00:00.000Z"
}
```

## 🔧 Настройка в ЮKassa

1. Войдите в личный кабинет ЮKassa
2. Перейдите в **Настройки** → **HTTP-уведомления**
3. Нажмите **Добавить webhook**
4. Укажите URL вашего сервера:
   ```
   https://your-domain.com/v1/webhook
   ```
5. Выберите события:
   - ✅ `payment.succeeded`
6. Скопируйте **Секретный ключ** и вставьте в `.env`

## 🛡️ Безопасность

- ✅ Проверка HMAC-SHA256 подписи
- ✅ Constant-time comparison для предотвращения timing attacks
- ✅ Raw body parsing для корректной верификации
- ✅ Логирование всех событий

## 📦 Структура проекта

```
server/
├── server.js           # Основной сервер
├── package.json        # Зависимости
├── .env.example        # Пример переменных окружения
├── .env                # Реальные переменные (не коммитить!)
├── .gitignore          # Игнорируемые файлы
└── logs/
    └── payments.log    # Лог платежей
```

## 🚀 Деплой

### Heroku

```bash
heroku create ispoved-server
heroku config:set YOOKASSA_WEBHOOK_SECRET=your_secret
heroku config:set NODE_ENV=production
git push heroku main
```

### Vercel

Создайте `vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

### Docker

Создайте `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Тестирование

### Тестовый webhook

Используйте curl для проверки:

```bash
curl -X POST http://localhost:3000/v1/webhook \
  -H "Content-Type: application/json" \
  -H "X-Yookassa-Signature: test" \
  -d '{"event":"payment.succeeded","object":{"id":"test123"}}'
```

### Проверка логов

```bash
tail -f logs/payments.log
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи сервера
2. Убедитесь, что секретный ключ указан верно
3. Проверьте, что ЮKassa отправляет уведомления на правильный URL

## 📄 Лицензия

MIT
