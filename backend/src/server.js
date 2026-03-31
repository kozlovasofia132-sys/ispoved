import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createPayment } from './yookassa.js';
import { handleWebhook } from './webhook.js';

// Загрузка переменных окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Логгирование входящих запросов (для отладки)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * POST /v1/donate
 * Создание платежа ЮKassa (СБП)
 * 
 * Тело запроса:
 * {
 *   "amount": 100,        // Сумма в рублях (минимум 100)
 *   "description": "..."  // Описание платежа (опционально)
 * }
 * 
 * Ответ:
 * {
 *   "success": true,
 *   "sbpUrl": "https://..."  // URL для редиректа на оплату СБП
 * }
 */
app.post('/v1/donate', async (req, res) => {
  try {
    const { amount, description } = req.body;

    // Валидация суммы
    const sum = parseInt(amount, 10);
    if (isNaN(sum) || sum < 100) {
      return res.status(400).json({
        success: false,
        error: 'Минимальная сумма пожертвования — 100 рублей'
      });
    }

    if (sum > 1000000) {
      return res.status(400).json({
        success: false,
        error: 'Максимальная сумма пожертвования — 1 000 000 рублей'
      });
    }

    // Создание платежа
    const payment = await createPayment({
      amount: sum,
      description: description || 'Пожертвование на развитие приложения «Исповедь»',
      returnUrl: process.env.RETURN_URL || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/donate/success`
    });

    console.log(`✅ Платеж создан: ${payment.id} на сумму ${sum}₽`);

    res.json({
      success: true,
      sbpUrl: payment.sbpUrl,
      confirmation_url: payment.confirmation_url,
      payment_id: payment.id
    });

  } catch (error) {
    console.error('❌ Ошибка создания платежа:', error.message);
    res.status(500).json({
      success: false,
      error: 'Не удалось создать платеж. Попробуйте позже.'
    });
  }
});

/**
 * POST /v1/webhook
 * Обработчик уведомлений от ЮKassa
 */
app.post('/v1/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('📩 Webhook получен:', event.type);

    await handleWebhook(event);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Ошибка обработки webhook:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /health
 * Проверка работоспособности сервера
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ispoved-backend'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           🙏 ISPONED BACKEND SERVER                       ║
╠═══════════════════════════════════════════════════════════╣
║  Порт: ${PORT}
║  Режим: ${process.env.NODE_ENV || 'development'}
║  Shop ID: ${process.env.YOOKASSA_SHOP_ID}
╠═══════════════════════════════════════════════════════════╣
║  Эндпоинты:                                               ║
║  POST /v1/donate     — создание платежа (СБП)            ║
║  POST /v1/webhook    — уведомления от ЮKassa             ║
║  GET  /health        — проверка статуса                  ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
