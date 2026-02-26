
# 🚀 Payment Gateway Simulation API

A lightweight Node.js/Express service that mimics a payment gateway for testing and learning purposes.

---

## 📌 Overview

This project simulates payment transactions without a real payment provider. It's ideal for:

- Backend developers building/evaluating client integrations
- QA teams needing deterministic outcomes (success, failure, fraud)
- Learning exercises around state machines, webhooks, and MongoDB

The service tracks each payment's lifecycle, supports retries/refunds, and can notify an external endpoint when anything changes.

---

## ✨ Features

- 💳 Create payments with `amount`, `currency`, and `customerId`
- 🔄 Automatic processing pipeline: `CREATED` → `PROCESSING` → `SUCCESS`/`FAILED`
- 🔁 Retry of failed payments, and refund of successful ones
- ⚠️ Fraud detection rule (amounts > 10000 fail immediately)
- 🔍 Fetch individual payment status by ID with full details
- 📊 Summary endpoint with status counts and failure reasons
- 📨 Optional webhook callbacks on every status transition
- 🧩 Clean controller-based structure for easy maintenance
- 🌐 Browser-based frontend (`client.html`) to interact with the API visually
- 🏥 Health check endpoint showing server status and connected database
- 🔢 Retry counter tracking how many times a payment has been retried
- 🚨 Fraud flag (`isFraudulent`) to distinguish fraud failures from other failures

---

## 🏗️ Tech Stack

- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Frontend:** HTML, CSS, JavaScript
- **Dev Tools:** Nodemon, dotenv, cors

---

## 📂 Project Structure

```
Northern-Trust-Team-6/
├── Server/                # API server code
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── controllers/
│   │   └── paymentController.js   # All route handlers + processing logic
│   ├── models/
│   │   └── payments.js    # Mongoose schema
│   ├── .env               # Environment variables (not committed)
│   ├── package.json
│   └── server.js          # Express app entry point
├── client.html            # Browser frontend
└── README.md
```

---

## ⚙️ Installation

```bash
git clone https://github.com/SevanthiShekar/Northern-Trust-Team-6.git
cd Northern-Trust-Team-6/Server
npm install
```

### 🔐 Environment Variables

Create a `.env` file inside the `Server/` folder:

```
MONGO_URI=mongodb+srv://.../Payment_Gateway_Stimulation
PORT=3000
WEBHOOK_URL=https://webhook.site/your-id   # optional
```

---

## 🚀 Usage

Run in development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

API listens on `http://localhost:3000` by default.

### 🖥️ Frontend

Open `client.html` in VS Code and click **"Go Live"** (Live Server extension), or open it directly in a browser.

---

## 📦 API Endpoints

Base URL: `http://localhost:3000/payments`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Create a new payment |
| `GET` | `/` | List all payments |
| `GET` | `/raw` | Raw Mongo query of all payments |
| `GET` | `/summary` | Aggregated status counts + failure breakdown |
| `GET` | `/:id` | Retrieve payment by ID |
| `POST` | `/:id/retry` | Retry a payment with status `FAILED` |
| `POST` | `/:id/refund` | Refund a payment with status `SUCCESS` |
| `GET` | `/health` | Server + database health check |
| `GET` | `/test` | Simple connectivity test |

---

## 🔄 State Transitions

Every payment follows a strict lifecycle. No arbitrary state jumps are allowed.

```
                    ┌──────────────────────────────────┐
                    ▼                                  │
  [CREATED] ──► [PROCESSING] ──► [SUCCESS] ──► [REFUNDED]
                    │
                    └──► [FAILED] ──► [CREATED]  (via retry)
                                          │
                                     [PROCESSING] ──► ...
```

### State Descriptions

| State | Description |
|-------|-------------|
| `CREATED` | Payment record created, queued for background processing |
| `PROCESSING` | Payment is actively being evaluated |
| `SUCCESS` | Payment passed all checks and completed successfully |
| `FAILED` | Payment was rejected due to fraud, invalid input, or random failure |
| `REFUNDED` | A previously successful payment that has been reversed |

### Transition Rules

| From | To | How |
|------|----|-----|
| `CREATED` | `PROCESSING` | Automatic — ~2 seconds after creation |
| `PROCESSING` | `SUCCESS` | Automatic — after 2–5 second delay, if no failure |
| `PROCESSING` | `FAILED` | Automatic — if fraud, invalid amount, or random failure |
| `FAILED` | `CREATED` | Manual — via `POST /payments/:id/retry` |
| `SUCCESS` | `REFUNDED` | Manual — via `POST /payments/:id/refund` |

> ⚠️ `REFUNDED` is a terminal state — no further transitions are possible.

---

## ⚠️ Failure Rules

When a payment enters `PROCESSING`, it is evaluated against these rules in order:

| Priority | Condition | `status` | `failureReason` | `isFraudulent` |
|----------|-----------|----------|----------------|----------------|
| 1st | `amount <= 0` | `FAILED` | `"Invalid Amount"` | `false` |
| 2nd | `amount > 10000` | `FAILED` | `"Fraud detected"` | `true` |
| 3rd | Random (~50% chance) | `FAILED` | `null` | `false` |
| — | All checks pass | `SUCCESS` | `null` | `false` |

**Key constraints:**
- Only `FAILED` payments can be retried
- Only `SUCCESS` payments can be refunded
- Retrying resets `status` to `CREATED` and increments `retryCount`

---

## 🧠 Design Assumptions

1. **Asynchronous Processing**: After creation, the API responds immediately with a `paymentId`. Processing happens in the background using `setTimeout` to simulate gateway latency without blocking the response.

2. **Fraud Detection Threshold**: Any payment with `amount > 10,000` is automatically failed and flagged as fraudulent. The threshold is currency-agnostic and hardcoded for simulation purposes.

3. **Random Failure Simulation**: Payments that pass validity and fraud checks are still subject to ~50% random failure to simulate real-world uncertainty such as network errors or bank declines.

4. **Processing Delays**: A fixed 2-second delay precedes processing, followed by a random 2–5 second window. This simulates realistic gateway latency without relying on external services.

5. **No Retry Limit**: The `retryCount` field tracks retries but no maximum is enforced — intentionally left open for future enhancement.

6. **Currency Storage Only**: Currency codes are stored as uppercase strings. No conversion, exchange rates, or multi-currency validation is performed.

7. **No Authentication**: All endpoints are publicly accessible without tokens or API keys. Acceptable for hackathon/demo — not for production.

8. **Webhook Notifications**: On every status change, a POST is sent to `WEBHOOK_URL` if configured. If not set, the event is logged to console — simulating event-driven architecture.

9. **Single MongoDB Collection**: All payments regardless of status live in one `payments` collection. The `status` field acts as the state machine indicator.

10. **Schema Validation at DB Layer**: Mongoose enforces required fields, validates `status` against an enum, and auto-converts `currency` to uppercase — preventing bad data from entering the database.

11. **`isFraudulent` Flag**: Fraud-related failures are separately flagged with `isFraudulent: true` to allow downstream analytics to distinguish fraud from other failure types.

12. **Health Check Endpoint**: `/health` returns the current port and connected MongoDB database name — useful for debugging deployment without exposing credentials.

---

## 🗃️ Data Model

```js
{
  amount:        Number,   // required, must be > 0
  currency:      String,   // required, stored uppercase (e.g. "USD", "INR")
  customerId:    String,   // required (e.g. "CUST1001")
  status:        String,   // CREATED | PROCESSING | SUCCESS | FAILED | REFUNDED
  failureReason: String,   // null if not failed
  retryCount:    Number,   // default 0, increments on each retry
  isFraudulent:  Boolean,  // default false, true if fraud detected
  createdAt:     Date,     // auto-managed by Mongoose
  updatedAt:     Date      // auto-managed by Mongoose
}
```

---

## 📨 Webhooks

When `WEBHOOK_URL` is set, the server sends a POST to that URL after each status change:

```json
{
  "success": true,
  "paymentId": "69a0754b7f7ba151cc0d79f3",
  "status": "PROCESSING"
}
```

Without a URL the payload is merely logged.

---

## 🧪 Testing

No automated tests are provided, but you can exercise all endpoints with Postman or curl.

| Test Case | Method | URL | Body |
|-----------|--------|-----|------|
| Create payment | POST | `/payments` | `{ "amount": 500, "currency": "USD", "customerId": "CUST001" }` |
| Get by ID | GET | `/payments/:id` | — |
| Trigger fraud | POST | `/payments` | `{ "amount": 15000, "currency": "USD", "customerId": "CUST002" }` |
| Retry failed | POST | `/payments/:id/retry` | — |
| Refund success | POST | `/payments/:id/refund` | — |
| Summary | GET | `/payments/summary` | — |

---

## 🤝 Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m "Add YourFeature"`
4. Push to your branch: `git push origin feature/YourFeature`
5. Open a pull request targeting `dev`


## 👥 Team
Sevanthi Shekar 
Siddhi Pardeshi
Zeeshan Khan 
THUDUMALADINNE BHASHITHA
Bhumi Bhat

