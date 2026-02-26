# 🚀 Payment Gateway Simulation API

A lightweight Node.js/Express service that mimics a payment gateway for testing and learning purposes.

---

## 📌 Overview

This project simulates payment transactions without a real payment provider. It’s ideal for:

- Backend developers building/evaluating client integrations
- QA teams needing deterministic outcomes (success, failure, fraud)
- Learning exercises around state machines, webhooks, and MongoDB

The service tracks each payment’s lifecycle, supports retries/refunds, and can notify an external endpoint when anything changes.

---

## ✨ Features

- 💳 Create payments with `amount`, `currency`, and `customerId`
- 🔄 Automatic processing pipeline: `CREATED` → `PROCESSING` → `SUCCESS`/`FAILED`
- 🔁 Retry of failed payments, and refund of successful ones
- ⚠️ Fraud detection rule (amounts > 10000 fail immediately)
- 📊 Summary endpoint with status counts and failure reasons
- 📨 Optional webhook callbacks on every status transition
- 🧩 Clean controller-based structure for easy maintenance

---

## 🏗️ Tech Stack

- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose ODM)
- **HTTP Client:** Axios (for webhook delivery)
- **Dev Tools:** Nodemon, dotenv, cors

---

## 📂 Project Structure

```
Northern-Trust-Team-6/
├── Server/                # API server code
│   ├── config/            # database connection helper
│   ├── controllers/       # route handlers
│   ├── models/            # Mongoose schemas
│   ├── package.json
│   └── server.js
├── .gitignore
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

Copy `.env.example` to `.env` and provide values:

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

The API will listen on `http://localhost:3000` by default.

---

## 📦 API Endpoints

Base URL: `http://localhost:3000/payments`

| Method | Endpoint        | Description                                      |
|--------|-----------------|--------------------------------------------------|
| POST   | `/`             | Create a new payment                             |
| GET    | `/`             | List all payments                                |
| GET    | `/raw`          | Raw Mongo query of all payments                  |
| GET    | `/summary`      | Aggregated status counts + failure breakdown     |
| GET    | `/:id`          | Retrieve payment by ID                           |
| POST   | `/:id/retry`    | Retry a payment with status `FAILED`             |
| POST   | `/:id/refund`   | Refund a payment with status `SUCCESS`           |
| GET    | `/test`         | Simple health/test route                         |

---

## 📨 Webhooks

When `WEBHOOK_URL` is set, the server sends a POST to that URL after each status change. Example payload:

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

No automated tests are provided, but you can exercise endpoints with Postman or curl. Example postman flows in earlier conversation.

---

## 🤝 Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m "Add YourFeature"`
4. Push to your branch: `git push origin feature/YourFeature`
5. Open a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👤 Author

Zeeshan Khan (on behalf of team)
GitHub: https://github.com/ZeeshanKhan

---

⭐ If you found this project useful, please give it a star!
