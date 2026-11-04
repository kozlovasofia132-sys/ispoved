/**
 * Ручная проверка вебхука ЮKassa.
 *
 * Запустите сервер с разрешённым локальным IP и (опционально) секретом:
 *   YOOKASSA_ALLOWED_IPS=127.0.0.1/32 YOOKASSA_WEBHOOK_SECRET=test_secret node server.js
 *
 * Затем:
 *   node test-webhook.js
 */

import fetch from 'node-fetch';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/v1/webhook';
const WEBHOOK_SECRET = process.env.YOOKASSA_WEBHOOK_SECRET || '';

const payment = {
    event: 'payment.succeeded',
    object: {
        id: '2d3df78f-000e-500b-9000-1e7c9a9b0e0e',
        status: 'succeeded',
        amount: { value: '100.00', currency: 'RUB' },
        description: 'Тестовое пожертвование',
        metadata: { user_id: '12345', campaign: 'donation' },
        payment_method: { type: 'bank_card', card: { last4: '1234', card_type: 'Visa' } },
        created_at: new Date().toISOString(),
        captured_at: new Date().toISOString()
    }
};

async function send(name, payload, headers = {}) {
    console.log(`\n▶ ${name}`);
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(payload)
        });
        const body = await response.text();
        console.log(`  HTTP ${response.status}: ${body}`);
        return response.status;
    } catch (error) {
        console.log('  ❌ Ошибка запроса:', error.message);
        return null;
    }
}

async function main() {
    console.log(`Вебхук: ${WEBHOOK_URL}`);

    await send('Оплата без секрета (ожидается 403, если секрет задан на сервере)', payment);

    if (WEBHOOK_SECRET) {
        await send('Оплата с верным секретом (ожидается 200)', payment, {
            'X-Webhook-Secret': WEBHOOK_SECRET
        });
        await send('Оплата с неверным секретом (ожидается 403)', payment, {
            'X-Webhook-Secret': 'wrong_secret'
        });
    }

    await send('Другое событие (ожидается 200 и запись в лог)', {
        event: 'payment.waiting_for_capture',
        object: { id: 'waiting123', status: 'pending' }
    }, WEBHOOK_SECRET ? { 'X-Webhook-Secret': WEBHOOK_SECRET } : {});

    console.log('\nГотово. Проверьте logs/payments.log.');
}

main().catch(console.error);
