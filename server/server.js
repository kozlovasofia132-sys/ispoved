/**
 * Ispoved backend
 *
 * 1. Раздаёт ИИ-комментарии к чтениям дня (GET /summaries.json).
 * 2. Принимает уведомления ЮKassa (POST /v1/webhook).
 * 3. Отдаёт журнал платежей только по админ-токену (GET /v1/payments).
 *
 * Запуск: node server.js
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const WEBHOOK_SECRET = process.env.YOOKASSA_WEBHOOK_SECRET || '';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Если сервер стоит за reverse-proxy (nginx), включаем доверие к X-Forwarded-For
if (process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
}

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_FILE = process.env.LOG_FILE_PATH || path.join(logsDir, 'payments.log');
const SUMMARIES_FILE = path.join(__dirname, 'data', 'summaries.json');

// Официальные диапазоны IP ЮKassa:
// https://yookassa.ru/developers/using-api/interaction-format#notification-ip
const DEFAULT_YOOKASSA_IPS = [
    '185.71.76.0/27',
    '185.71.77.0/27',
    '77.75.153.0/25',
    '77.75.156.11/32',
    '77.75.156.35/32',
    '77.75.154.128/25'
];

const YOOKASSA_ALLOWED_IPS = (process.env.YOOKASSA_ALLOWED_IPS
    ? process.env.YOOKASSA_ALLOWED_IPS.split(',').map(s => s.trim()).filter(Boolean)
    : DEFAULT_YOOKASSA_IPS);

app.disable('x-powered-by');
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '64kb' }));

/**
 * Эндпоинт для приложения: GET /summaries.json
 * Раздаёт ИИ-комментарии к чтениям дня
 */
app.get('/summaries.json', (req, res) => {
    try {
        if (!fs.existsSync(SUMMARIES_FILE)) {
            return res.json({});
        }
        const data = fs.readFileSync(SUMMARIES_FILE, 'utf8');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 часа
        res.send(data);
    } catch (e) {
        console.error('[Summaries] Ошибка чтения файла:', e.message);
        res.status(500).json({ error: 'Failed to read summaries' });
    }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Нормализация IP: убираем IPv6-префикс и порт.
 */
function normalizeIp(ip = '') {
    return String(ip)
        .replace(/^::ffff:/i, '')
        .replace(/^\[|\]$/g, '')
        .split(':')[0];
}

function ipv4ToInt(ip) {
    return ip.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

function isIpInCidr(ip, cidr) {
    const [base, bitsRaw] = cidr.trim().split('/');
    const bits = Number(bitsRaw ?? 32);
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip) || !/^\d+\.\d+\.\d+\.\d+$/.test(base)) return false;
    if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

function isAllowedWebhookIp(ip) {
    return YOOKASSA_ALLOWED_IPS.some(cidr => isIpInCidr(ip, cidr));
}

function safeEquals(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * YooKassa Webhook Endpoint
 * POST /v1/webhook
 *
 * ЮKassa не подписывает уведомления HMAC-подписью: проверяем источник по IP,
 * а при наличии YOOKASSA_WEBHOOK_SECRET — дополнительный общий секрет
 * (заголовок X-Webhook-Secret), если он задан на стороне прокси.
 */
app.post('/v1/webhook', (req, res) => {
    const clientIp = normalizeIp(req.ip || req.socket?.remoteAddress);
    console.log('[Webhook] Received request from:', clientIp);

    if (!isAllowedWebhookIp(clientIp)) {
        console.error('[Webhook] IP is not allowed:', clientIp);
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (WEBHOOK_SECRET) {
        const secret = req.headers['x-webhook-secret'];
        if (!safeEquals(secret || '', WEBHOOK_SECRET)) {
            console.error('[Webhook] Invalid webhook secret');
            return res.status(403).json({ error: 'Forbidden' });
        }
    }

    const event = req.body;
    if (!event || typeof event !== 'object') {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    console.log('[Webhook] Event type:', event.event);

    if (event.event === 'payment.succeeded') {
        handleSuccessfulPayment(event.object || {});
    } else {
        console.log('[Webhook] Event type not handled:', event.event);
    }

    // Отвечаем 200, чтобы ЮKassa не повторяла доставку
    res.status(200).json({ received: true });
});

/**
 * Handle successful payment
 * @param {Object} payment - Payment object from YooKassa
 */
function handleSuccessfulPayment(payment) {
    const paymentData = {
        timestamp: new Date().toISOString(),
        status: 'Успешно',
        payment_id: payment.id,
        amount: payment.amount ? {
            value: payment.amount.value,
            currency: payment.amount.currency
        } : null,
        description: payment.description || '',
        metadata: payment.metadata || {},
        payment_method: payment.payment_method ? {
            type: payment.payment_method.type,
            card: payment.payment_method.card ? {
                last4: payment.payment_method.card.last4,
                card_type: payment.payment_method.card.card_type
            } : null
        } : null,
        income_amount: payment.income_amount ? {
            value: payment.income_amount.value,
            currency: payment.income_amount.currency
        } : null,
        created_at: payment.created_at,
        captured_at: payment.captured_at
    };

    logPayment(paymentData);

    console.log('[Payment] Successfully processed:', {
        id: payment.id,
        amount: payment.amount?.value,
        currency: payment.amount?.currency
    });
}

/**
 * Log payment to file
 * @param {Object} paymentData
 */
function logPayment(paymentData) {
    const logEntry = JSON.stringify(paymentData) + '\n';

    fs.appendFile(LOG_FILE, logEntry, (err) => {
        if (err) {
            console.error('[Logger] Error writing to log file:', err.message);
        } else {
            console.log('[Logger] Payment logged successfully');
        }
    });
}

/**
 * Get payments log endpoint (for admin use)
 * GET /v1/payments?limit=10
 * Требует заголовок Authorization: Bearer <ADMIN_TOKEN>.
 */
app.get('/v1/payments', (req, res) => {
    if (!ADMIN_TOKEN) {
        return res.status(404).json({ error: 'Not found' });
    }

    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!safeEquals(token, ADMIN_TOKEN)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 10;

    try {
        if (!fs.existsSync(LOG_FILE)) {
            return res.json({ payments: [], message: 'No payments yet' });
        }

        const logContent = fs.readFileSync(LOG_FILE, 'utf8');
        const lines = logContent.trim().split('\n').filter(line => line.trim());

        const payments = lines
            .slice(-limit)
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    return null;
                }
            })
            .filter(p => p !== null);

        res.json({ payments, total: lines.length });
    } catch (error) {
        console.error('[API] Error reading payments:', error.message);
        res.status(500).json({ error: 'Failed to read payments' });
    }
});

// Start server. Если заданы SSL_KEY_PATH/SSL_CERT_PATH — поднимаем HTTPS напрямую,
// иначе предполагается reverse-proxy (nginx/certbot).
const sslKeyPath = process.env.SSL_KEY_PATH;
const sslCertPath = process.env.SSL_CERT_PATH;

function onListening(protocol) {
    console.log(`
╔════════════════════════════════════════════════════════╗
║  Ispoved Backend                                       ║
║  ------------------------------------------------------║
║  Server running on ${protocol}://localhost:${PORT}          ║
║  Webhook endpoint: POST /v1/webhook                    ║
║  Health check: GET /health                             ║
║  Payments API: GET /v1/payments (ADMIN_TOKEN)          ║
║  Environment: ${process.env.NODE_ENV || 'development'}                        ║
╚════════════════════════════════════════════════════════╝
    `);
}

if (sslKeyPath && sslCertPath) {
    const server = https.createServer(
        { key: fs.readFileSync(sslKeyPath), cert: fs.readFileSync(sslCertPath) },
        app
    );
    server.listen(PORT, () => onListening('https'));
} else {
    app.listen(PORT, () => onListening('http'));
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[Server] SIGINT received, shutting down gracefully...');
    process.exit(0);
});
