// YooKassa REST API Client
// Документация: https://yookassa.ru/developers/api

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3';

function getAuthHeader() {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    throw new Error('YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY должны быть заданы в .env');
  }

  return 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64');
}

/**
 * Создание платежа ЮKassa с методом оплаты СБП
 */
export async function createPayment({ amount, description, returnUrl }) {
  const idempotenceKey = `donate-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const body = {
    amount: {
      value: amount.toFixed(2),
      currency: 'RUB'
    },
    confirmation: {
      type: 'redirect',
      return_url: returnUrl
    },
    capture: true,
    description,
    metadata: {
      source: 'ispoved-app'
    }
  };

  const response = await fetch(`${YOOKASSA_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
      'Idempotence-Key': idempotenceKey
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`ЮKassa API error ${response.status}: ${errorData.description || response.statusText}`);
  }

  const payment = await response.json();

  return {
    id: payment.id,
    status: payment.status,
    amount: payment.amount.value,
    sbpUrl: payment.confirmation?.confirmation_url,
    confirmation_url: payment.confirmation?.confirmation_url
  };
}

/**
 * Получение информации о платеже
 */
export async function getPayment(paymentId) {
  const response = await fetch(`${YOOKASSA_API_URL}/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader()
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`ЮKassa API error ${response.status}: ${errorData.description || response.statusText}`);
  }

  const payment = await response.json();

  return {
    id: payment.id,
    status: payment.status,
    amount: payment.amount.value,
    created_at: payment.created_at
  };
}
