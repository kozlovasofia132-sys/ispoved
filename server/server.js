/**
 * YooKassa Webhook Handler Server
 * 
 * This server handles payment success notifications from YooKassa
 * and logs successful payments for future use in the "Gratitude" section
 */

import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.YOOKASSA_WEBHOOK_SECRET;

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_FILE = process.env.LOG_FILE_PATH || path.join(logsDir, 'payments.log');

/**
 * Middleware to parse raw body for signature verification
 * Must be used before express.json() for webhook endpoint
 */
app.use('/v1/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * YooKassa Webhook Endpoint
 * POST /v1/webhook
 */
app.post('/v1/webhook', (req, res) => {
    console.log('[Webhook] Received request from:', req.ip);
    
    // Get signature from headers
    const signature = req.headers['x-yookassa-signature'];
    
    if (!signature) {
        console.error('[Webhook] Missing signature header');
        return res.status(401).json({ error: 'Missing signature' });
    }
    
    // Verify signature
    const isValid = verifyWebhookSignature(req.body, signature, WEBHOOK_SECRET);
    
    if (!isValid) {
        console.error('[Webhook] Invalid signature');
        return res.status(403).json({ error: 'Invalid signature' });
    }
    
    console.log('[Webhook] Signature verified successfully');
    
    // Parse the event
    const event = req.body;
    console.log('[Webhook] Event type:', event.event);
    
    // Handle payment.succeeded event
    if (event.event === 'payment.succeeded') {
        handleSuccessfulPayment(event.object);
    } else {
        console.log('[Webhook] Event type not handled:', event.event);
    }
    
    // Acknowledge receipt
    res.status(200).json({ received: true });
});

/**
 * Verify YooKassa webhook signature
 * @param {Object} payload - Webhook payload
 * @param {string} signature - Signature from header
 * @param {string} secret - Webhook secret key
 * @returns {boolean} - True if signature is valid
 */
function verifyWebhookSignature(payload, signature, secret) {
    if (!secret) {
        console.error('[Signature] No secret configured');
        return false;
    }
    
    try {
        // Convert payload to JSON string
        const payloadString = JSON.stringify(payload);
        
        // Create HMAC-SHA256 signature
        const hmac = crypto.createHmac('sha256', secret);
        const calculatedSignature = hmac.update(payloadString).digest('hex');
        
        // Compare signatures using constant-time comparison
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(calculatedSignature, 'hex')
        );
    } catch (error) {
        console.error('[Signature] Verification error:', error.message);
        return false;
    }
}

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
    
    // Log to file
    logPayment(paymentData);
    
    // Log to console
    console.log('[Payment] Successfully processed:', {
        id: payment.id,
        amount: payment.amount?.value,
        currency: payment.amount?.currency
    });
    
    // Here you can also:
    // - Save to database (MongoDB, PostgreSQL, etc.)
    // - Send notification email
    // - Update user balance
    // - Trigger other business logic
}

/**
 * Log payment to file
 * @param {Object} paymentData - Payment data to log
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
 */
app.get('/v1/payments', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    
    try {
        if (!fs.existsSync(LOG_FILE)) {
            return res.json({ payments: [], message: 'No payments yet' });
        }
        
        const logContent = fs.readFileSync(LOG_FILE, 'utf8');
        const lines = logContent.trim().split('\n').filter(line => line.trim());
        
        // Get last N payments
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

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║  YooKassa Webhook Server                               ║
║  ------------------------------------------------------║
║  Server running on port ${PORT}                            ║
║  Webhook endpoint: POST /v1/webhook                    ║
║  Health check: GET /health                             ║
║  Payments API: GET /v1/payments                        ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
╚════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[Server] SIGINT received, shutting down gracefully...');
    process.exit(0);
});
