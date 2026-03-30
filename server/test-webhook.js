/**
 * Test script for YooKassa webhook
 * Send test webhook requests to verify signature validation
 */

import crypto from 'crypto';
import fetch from 'node-fetch';

const WEBHOOK_URL = 'http://localhost:3000/v1/webhook';
const WEBHOOK_SECRET = 'test_secret_key_123';

// Test payment payload
const testPayload = {
    event: 'payment.succeeded',
    object: {
        id: '2d3df78f-000e-500b-9000-1e7c9a9b0e0e',
        status: 'succeeded',
        amount: {
            value: '100.00',
            currency: 'RUB'
        },
        description: 'Тестовое пожертвование',
        metadata: {
            user_id: '12345',
            campaign: 'donation'
        },
        payment_method: {
            type: 'bank_card',
            card: {
                last4: '1234',
                card_type: 'Visa'
            }
        },
        created_at: new Date().toISOString(),
        captured_at: new Date().toISOString()
    }
};

// Generate signature
function generateSignature(payload, secret) {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    return hmac.update(payloadString).digest('hex');
}

async function sendTestWebhook() {
    console.log('🧪 Testing YooKassa Webhook\n');
    
    // Test 1: Valid signature
    console.log('Test 1: Sending webhook with VALID signature...');
    const validSignature = generateSignature(testPayload, WEBHOOK_SECRET);
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Yookassa-Signature': validSignature
            },
            body: JSON.stringify(testPayload)
        });
        
        const result = await response.json();
        console.log('✅ Status:', response.status);
        console.log('✅ Response:', result);
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    console.log('\n---\n');
    
    // Test 2: Invalid signature
    console.log('Test 2: Sending webhook with INVALID signature...');
    const invalidSignature = 'invalid_signature_abc123';
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Yookassa-Signature': invalidSignature
            },
            body: JSON.stringify(testPayload)
        });
        
        const result = await response.json();
        console.log('✅ Status:', response.status);
        console.log('✅ Response:', result);
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    console.log('\n---\n');
    
    // Test 3: Missing signature
    console.log('Test 3: Sending webhook with MISSING signature...');
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPayload)
        });
        
        const result = await response.json();
        console.log('✅ Status:', response.status);
        console.log('✅ Response:', result);
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    console.log('\n---\n');
    
    // Test 4: Different event type
    console.log('Test 4: Sending webhook with payment.waiting event...');
    const waitingPayload = {
        event: 'payment.waiting',
        object: {
            id: 'waiting123',
            status: 'waiting'
        }
    };
    const waitingSignature = generateSignature(waitingPayload, WEBHOOK_SECRET);
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Yookassa-Signature': waitingSignature
            },
            body: JSON.stringify(waitingPayload)
        });
        
        const result = await response.json();
        console.log('✅ Status:', response.status);
        console.log('✅ Response:', result);
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
    
    console.log('\n🎉 Tests completed!\n');
}

// Run tests
sendTestWebhook().catch(console.error);
