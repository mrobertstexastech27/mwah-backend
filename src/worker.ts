import { Worker } from '@temporalio/worker';
import * as activities from './activities/orderActivities';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows/orderWorkflow'),
    activities,
    taskQueue: 'mwah-order-queue',
  });

  console.log('Worker started. Listening on task queue: mwah-order-queue');
  await worker.run();
}

run().catch((err) => {
  console.error('Worker failed:', err);
  process.exit(1);
});
