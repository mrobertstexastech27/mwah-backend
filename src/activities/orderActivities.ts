import { activityInfo } from '@temporalio/activity';
import type { Order } from '../types';

// All activities are mocked — in production these would call
// Shopify, Printify, Stripe, and ConvertKit APIs.

export async function validateOrder(order: Order): Promise<void> {
  console.log(`[validateOrder] Validating order ${order.orderId}`);
  if (!order.customerEmail || !order.itemSku || order.quantity < 1) {
    throw new Error('Invalid order data');
  }
  console.log(`[validateOrder] Order ${order.orderId} is valid`);
}

export async function reserveInventory(order: Order): Promise<void> {
  console.log(`[reserveInventory] Reserving ${order.quantity}x ${order.itemSku}`);
  // Mock: pretend inventory is available
  console.log(`[reserveInventory] Inventory reserved for order ${order.orderId}`);
}

export async function releaseInventory(order: Order): Promise<void> {
  console.log(`[releaseInventory] Releasing inventory for order ${order.orderId} (compensation)`);
}

export async function authorizePayment(order: Order): Promise<void> {
  console.log(`[authorizePayment] Authorizing $${order.amount} for order ${order.orderId}`);
  // Mock: pretend payment authorized
  console.log(`[authorizePayment] Payment authorized for order ${order.orderId}`);
}

export async function refundPayment(order: Order): Promise<void> {
  console.log(`[refundPayment] Refunding $${order.amount} for order ${order.orderId} (compensation)`);
}

export async function createFulfillmentRequest(order: Order): Promise<void> {
  console.log(`[createFulfillmentRequest] Sending order ${order.orderId} to fulfillment`);
  if (order.simulateFailure) {
    throw new Error('Fulfillment service unavailable');
  }
  if (order.simulateTransient) {
    const attempt = activityInfo().attempt;
    console.log(`[createFulfillmentRequest] Attempt ${attempt} of 3`);
    if (attempt < 3) {
      throw new Error(`Transient error on attempt ${attempt} — Temporal will retry automatically`);
    }
    console.log(`[createFulfillmentRequest] Recovered on attempt ${attempt} — fulfillment created`);
    return;
  }
  console.log(`[createFulfillmentRequest] Fulfillment created for order ${order.orderId}`);
}

export async function sendCustomerNotification(order: Order, message: string): Promise<void> {
  console.log(`[sendCustomerNotification] Emailing ${order.customerEmail}: ${message}`);
}
