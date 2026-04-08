import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/orderActivities';
import { Order, OrderResult } from '../types';

const {
  validateOrder,
  reserveInventory,
  releaseInventory,
  authorizePayment,
  refundPayment,
  createFulfillmentRequest,
  sendCustomerNotification,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 3,
  },
});

export async function orderWorkflow(order: Order): Promise<OrderResult> {
  let inventoryReserved = false;
  let paymentAuthorized = false;

  await validateOrder(order);

  await reserveInventory(order);
  inventoryReserved = true;

  await authorizePayment(order);
  paymentAuthorized = true;

  try {
    await createFulfillmentRequest(order);
  } catch (err) {
    // Fulfillment failed — run compensation
    console.log(`Fulfillment failed for order ${order.orderId}. Running compensation...`);

    if (paymentAuthorized) {
      await refundPayment(order);
    }
    if (inventoryReserved) {
      await releaseInventory(order);
    }
    await sendCustomerNotification(
      order,
      `Sorry, we could not fulfill your order ${order.orderId}. Your payment has been refunded.`
    );

    throw new Error(`Order ${order.orderId} failed: fulfillment unavailable. Compensation complete — inventory released and payment refunded.`);
  }

  await sendCustomerNotification(
    order,
    `Your order ${order.orderId} has been confirmed and is on its way!`
  );

  return {
    status: 'completed',
    orderId: order.orderId,
    message: 'Order fulfilled successfully.',
  };
}
