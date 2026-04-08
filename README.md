# Temporal Order Workflow — Michelle With A Heart

This project demonstrates how Temporal orchestrates an e-commerce order workflow for [Michelle With A Heart](https://michellewithaheart.com), a real creator/apparel brand selling print-on-demand merchandise.

External systems (Shopify, Printify, Stripe, ConvertKit) are mocked per the exercise guidance, keeping the focus on Temporal orchestration, retries, and compensation logic.

---

## Why This Use Case

An apparel order involves multiple distributed steps — payment, inventory, fulfillment, and customer notification. Any one of these can fail independently. Without Temporal, a failure mid-flow can leave an order in a broken state: payment charged but nothing shipped, or inventory reserved but never released.

Temporal solves this by making the entire workflow durable, retryable, and observable.

---

## Architecture

### Happy Path

```
Order Placed
    → validateOrder
    → reserveInventory
    → authorizePayment
    → createFulfillmentRequest
    → sendCustomerNotification
    → Completed ✓
```

### Failure Path (Permanent)

```
Order Placed
    → validateOrder
    → reserveInventory
    → authorizePayment
    → createFulfillmentRequest ✗ (fails after 3 attempts)
    → [Compensation]
        → refundPayment
        → releaseInventory
        → sendCustomerNotification (failure notice)
    → Failed (visible in Temporal UI)
```

### Transient Failure Path (Auto-Retry)

```
Order Placed
    → validateOrder
    → reserveInventory
    → authorizePayment
    → createFulfillmentRequest ✗ (attempt 1 fails)
    → createFulfillmentRequest ✗ (attempt 2 fails)
    → createFulfillmentRequest ✓ (attempt 3 succeeds — no human intervention)
    → sendCustomerNotification
    → Completed ✓
```

---

## Project Structure

```
src/
  workflows/orderWorkflow.ts     — main workflow logic
  activities/orderActivities.ts  — mocked activity implementations
  worker.ts                      — Temporal worker
  client.ts                      — workflow trigger
  types.ts                       — shared types
  sample-data/sampleOrder.json   — sample order input
docs/
  architecture-diagram.png
  failure-path-diagram.png
  site-screenshot.png
```

---

## How to Run Locally

### Prerequisites

- Node.js 18+
- [Temporal CLI](https://docs.temporal.io/cli)

```bash
brew install temporal
```

### Install dependencies

```bash
npm install
```

### Start the Temporal server

```bash
temporal server start-dev
```

### Start the worker (new terminal)

```bash
npm run worker
```

### Trigger a workflow (new terminal)

```bash
# Happy path — all steps succeed
npm run start

# Transient failure — Temporal retries automatically, order completes
npm run start:transient

# Permanent failure — compensation runs, inventory released, payment refunded
npm run start:fail
```

Open the Temporal UI at **http://localhost:8233** to watch workflows run in real time.

---

## What to Look For in the UI

- **Happy path** — green Completed, all activities in sequence
- **Transient** — green Completed, `createFulfillmentRequest` shows retry count
- **Failure** — red Failed, event history shows compensation steps (refund + release) executed before failure

---

## In a Real Implementation

In production, each mocked activity would call a real external service:

| Activity | Real System |
|---|---|
| `validateOrder` | Shopify order validation |
| `reserveInventory` | Printify stock check |
| `authorizePayment` | Stripe payment intent |
| `createFulfillmentRequest` | Printify order creation |
| `sendCustomerNotification` | ConvertKit transactional email |

Temporal's value is that it handles retries, state, and compensation across all of these — even if any one service is temporarily unavailable.
