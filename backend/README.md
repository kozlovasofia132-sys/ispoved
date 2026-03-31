# Backend для приёма пожертвований (ЮKassa + СБП)

## 📋 Описание

Express-сервер для безопасной интеграции с ЮKassa. Поддерживает оплату через **Систему Быстрых Платежей (СБП)**.

## ⚙️ Установка

```bash
cd backend
npm install
```

## 🔐 Настройка

1. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Заполните `.env`:
```env
YOOKASSA_SHOP_ID=1314617
YOOKASSA_SECRET_KEY=live_ваш_секретный_ключ
PORT=3000
RETURN_URL=https://ispoved.app/donate/success
WEBHOOK_URL=https://your-domain.com/v1/webhook
```

> ⚠️ **Никогда не коммитьте `.env` в Git!** Файл уже добавлен в `.gitignore`.

## 🚀 Запуск

### Разработка (auto-reload)
```bash
npm run dev
```

### Продакшн
```bash
npm start
```

## 📡 API

### POST /v1/donate

Создание платежа СБП.

**Запрос:**
```json
{
  "amount": 300,
  "description": "Пожертвование на развитие приложения"
}
```

**Ответ:**
```json
{
  "success": true,
  "confirmation_url": "https://yookassa.ru/confirm/...",
  "payment_id": "2d3df..."
}
```

### POST /v1/webhook

Получение уведомлений от ЮKassa.

**Настройте в личном кабинете ЮKassa:**
- URL webhook: `https://your-domain.com/v1/webhook`
- События: `payment.succeeded`, `payment.canceled`

### GET /health

Проверка работоспособности.

**Ответ:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-30T12:00:00.000Z"
}
```

## 🔗 Интеграция с фронтендом

```javascript
async function createDonation(amount) {
  const response = await fetch('http://localhost:3000/v1/donate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  });

  const data = await response.json();

  if (data.success) {
    // Редирект на страницу оплаты ЮKassa
    window.location.href = data.confirmation_url;
  }
}
```

## 📁 Структура

```
backend/
├── src/
│   ├── server.js      # Express сервер, эндпоинты
│   ├── yookassa.js    # Клиент ЮKassa, создание платежей
│   └── webhook.js     # Обработчик уведомлений
├── .env.example       # Шаблон переменных окружения
├── .env               # Реальные данные (не коммитить!)
├── package.json
└── README.md
```

## 🛡️ Безопасность

- ✅ Секретные ключи хранятся только в `.env`
- ✅ CORS настроен на конкретный домен фронтенда
- ✅ Валидация суммы платежа (100 — 1 000 000 ₽)
- ✅ Логирование всех операций

## 📝 Лепта (пожертвования)

Все пожертвования идут на развитие православного приложения «Исповедь».  
Минимальная сумма: **100 ₽**

---

*Слава Богу за всё!* 🙏
