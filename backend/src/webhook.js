import { getPayment } from './yookassa.js';

/**
 * Обработчик webhook-уведомлений от ЮKassa
 * 
 * Типы событий:
 * - payment.succeeded — платеж успешно завершён
 * - payment.waiting_for_capture — платеж создан, ожидает подтверждения
 * - payment.canceled — платеж отменён
 * - refund.succeeded — возврат средств
 * 
 * @param {Object} event - Данные события от ЮKassa
 */
export async function handleWebhook(event) {
  const { type, object: paymentData } = event;

  console.log(`📬 Обработка события: ${type}`);
  console.log(`   Payment ID: ${paymentData.id}`);
  console.log(`   Status: ${paymentData.status}`);

  switch (type) {
    case 'payment.succeeded':
      await handlePaymentSucceeded(paymentData);
      break;

    case 'payment.waiting_for_capture':
      await handlePaymentWaitingForCapture(paymentData);
      break;

    case 'payment.canceled':
      await handlePaymentCanceled(paymentData);
      break;

    case 'refund.succeeded':
      await handleRefundSucceeded(paymentData);
      break;

    default:
      console.log(`⚠️ Необработанное событие: ${type}`);
  }
}

/**
 * Платеж успешно завершён
 * Здесь можно:
 * - Отправить благодарственное письмо
 * - Записать в базу данных
 * - Отправить уведомление администратору
 */
async function handlePaymentSucceeded(paymentData) {
  const { id, amount, metadata } = paymentData;

  console.log(`✅ Благое дело: получено пожертвование на сумму ${amount.value} руб.`);
  console.log(`   Источник: ${metadata?.source || 'неизвестно'}`);

  // TODO: Сохранить в базу данных
  // await db.donations.create({ ... })

  // TODO: Отправить уведомление
  // await sendThankYouNotification({ paymentId: id, amount: amount.value });
}

/**
 * Платеж ожидает подтверждения (если capture=false)
 */
async function handlePaymentWaitingForCapture(paymentData) {
  console.log(`⏳ Платеж ${paymentData.id} ожидает подтверждения`);
  // Если используется capture=true (автоматическое подтверждение),
  // это событие не будет приходить
}

/**
 * Платеж отменён
 */
async function handlePaymentCanceled(paymentData) {
  console.log(`❌ Платеж ${paymentData.id} отменён`);
  console.log(`   Причина: ${paymentData.cancellation_details?.reason || 'неизвестно'}`);

  // TODO: Записать в базу как отменённый
}

/**
 * Возврат средств
 */
async function handleRefundSucceeded(paymentData) {
  console.log(`↩️ Возврат по платежу ${paymentData.id} успешно обработан`);

  // TODO: Обновить статус в базе данных
}
