# 💳 Payment Gateway Simulation API
### Northern Trust Internship — Round 2 Hackathon | Team 6

A full-stack payment gateway simulation built with Node.js, Express, MongoDB, and a browser-based frontend. It mimics real-world payment lifecycle management including fraud detection, async processing, retries, and refunds.

---

## 📌 Overview

This project simulates a payment gateway without connecting to a real payment provider. It is designed to demonstrate:

- End-to-end payment lifecycle management
- Asynchronous background processing with realistic delays
- Rule-based fraud detection
- RESTful API design with proper HTTP status codes
- A browser-based frontend to interact with the API

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Frontend | HTML, CSS, JavaScript |
| Dev Tools | Nodemon, dotenv, cors |

---

## 📂 Project Structure


Northern-Trust-Team-6/
├── Server/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   └── paymentController.js   # All route handlers + processing logic
│   ├── models/
│   │   └── payments.js            # Mongoose schema
│   ├── .env                       # Environment variables (not committed)
│   ├── package.json
│   └── server.js                  # Express app entry point
├── client.html                    # Browser frontend
└── README.md


---

## ⚙️ Installation & Setup

bash
git clone https://github.com/SevanthiShekar/Northern-Trust-Team-6.git
cd Northern-Trust-Team-6/Server
npm install


### 🔐 Environment Variables

Create a .env file inside the Server/ folder:

env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/Payment_Gateway_Stimulation
WEBHOOK_URL=https://webhook.site/your-id    # optional


### ▶️ Run the Server

bash
npm run dev    # Development with auto-restart
npm start      # Production


Server starts at http://localhost:3000

### 🖥️ Run the Frontend

Open client.html in VS Code and click *"Go Live"* (Live Server extension), or open directly in a browser.

---

## 📦 API Endpoints

*Base URL:* http://localhost:3000/payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | / | Create a new payment |
| GET | / | List all payments |
| GET | /summary | Aggregated status counts + failure breakdown |
| GET | /raw | Raw MongoDB query of all payments |
| GET | /:id | Get payment by ID |
| POST | /:id/retry | Retry a FAILED payment |
| POST | /:id/refund | Refund a SUCCESS payment |
| GET | /health | Server + DB health check |
| GET | /test | Simple connectivity test |

---

## 🔄 State Transitions

Every payment moves through a defined set of states. No arbitrary jumps are allowed.


                    ┌─────────────────────────────────┐
                    ▼                                 │
  [CREATED] ──► [PROCESSING] ──► [SUCCESS] ──► [REFUNDED]
                    │
                    └──► [FAILED] ──► [CREATED]  (via retry)
                                         │
                                    [PROCESSING] ──► ...


### State Descriptions

| State | Description |
|-------|-------------|
| CREATED | Payment record created, queued for background processing |
| PROCESSING | Payment is actively being evaluated |
| SUCCESS | Payment passed all checks and completed successfully |
| FAILED | Payment was rejected due to fraud, invalid input, or random failure |
| REFUNDED | A previously successful payment that has been reversed |

### Transition Rules

| From | To | How |
|------|----|-----|
| CREATED | PROCESSING | Automatic — triggered ~2 seconds after creation |
| PROCESSING | SUCCESS | Automatic — after 2–5 second delay, if no failure |
| PROCESSING | FAILED | Automatic — if fraud, invalid amount, or random failure |
| FAILED | CREATED | Manual — via POST /payments/:id/retry |
| SUCCESS | REFUNDED | Manual — via POST /payments/:id/refund |

> ⚠️ REFUNDED is a terminal state. No further transitions are possible.

---

## ⚠️ Failure Rules

When a payment enters PROCESSING, it is evaluated against these rules in order:

| Priority | Condition | status | failureReason | isFraudulent |
|----------|-----------|----------|----------------|----------------|
| 1st | amount <= 0 | FAILED | "Invalid Amount" | false |
| 2nd | amount > 10000 | FAILED | "Fraud detected" | true |
| 3rd | Random (~50% chance) | FAILED | null | false |
| — | All checks pass | SUCCESS | null | false |

*Key constraints:*
- Only FAILED payments can be retried
- Only SUCCESS payments can be refunded
- Retrying resets status to CREATED and increments retryCount

---

## 🧠 Design Assumptions

1. *Asynchronous Processing*: After creation the API responds immediately with a paymentId. Processing happens in the background using setTimeout to simulate gateway latency without blocking the response.

2. *Fraud Detection Threshold*: Any payment with amount > 10,000 is automatically failed and flagged as fraudulent. The threshold is currency-agnostic and hardcoded for simulation purposes.

3. *Random Failure Simulation*: Payments that pass validity and fraud checks are still subject to ~50% random failure to simulate real-world uncertainty such as network errors or bank declines.

4. *Processing Delays*: A fixed 2-second delay precedes processing, followed by a random 2–5 second window. This simulates realistic gateway latency without relying on external services.

5. *No Retry Limit*: The retryCount field tracks retries but no maximum is enforced. This is intentionally open for future enhancement.

6. *Currency Storage Only*: Currency codes are stored as uppercase strings. No conversion, exchange rates, or multi-currency validation is performed.

7. *No Authentication*: All endpoints are publicly accessible without tokens or API keys. Acceptable for hackathon/demo — not for production.

8. *Webhook Notifications*: On every status change, a POST is sent to WEBHOOK_URL if configured. If not set, the event is logged to console — simulating event-driven architecture.

9. *Single MongoDB Collection*: All payments regardless of status live in one payments collection. The status field acts as the state machine indicator.

10. *Schema Validation at DB Layer*: Mongoose enforces required fields, validates status against an enum, and auto-converts currency to uppercase — preventing bad data from entering the database.

11. *isFraudulent Flag*: Fraud-related failures are separately flagged with isFraudulent: true to allow downstream analytics to distinguish fraud from other failure types.

12. *Health Check Endpoint*: /health returns the current port and connected MongoDB database name — useful for debugging deployment issues without exposing credentials.

---

## 🗃️ Data Model

js
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


---

## 👥 Team

| Name | GitHub |
|------|--------|
| Sevanthi Shekar 
| Siddhi Pardeshi
| Zeeshan Khan 
|THUDUMALADINNE BHASHITHA
|Bhumi Bhat

