import { Client, Connection } from '@temporalio/client';
import { orderWorkflow } from './workflows/orderWorkflow';
import type { Order } from './types';
import sampleOrder from './sample-data/sampleOrder.json';

async function run() {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection });

  const simulateFailure = process.argv.includes('--fail');
  const simulateTransient = process.argv.includes('--transient');

  const order: Order = {
    ...sampleOrder,
    simulateFailure,
    simulateTransient,
  };

  const mode = simulateFailure ? ' (FAILURE MODE)' : simulateTransient ? ' (TRANSIENT MODE)' : '';
  console.log(`Starting order workflow for order ${order.orderId}${mode}...`);

  const handle = await client.workflow.start(orderWorkflow, {
    args: [order],
    taskQueue: 'mwah-order-queue',
    workflowId: `order-${order.orderId}-${Date.now()}`,
  });

  console.log(`Workflow started. ID: ${handle.workflowId}`);

  const result = await handle.result();
  console.log('Workflow result:', result);
}

run().catch((err) => {
  console.error('Client failed:', err);
  process.exit(1);
});
