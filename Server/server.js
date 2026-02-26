require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const Payment = require("./models/payments");

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
  ],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB (non-blocking)
connectDB().catch(err => console.error("Failed to connect to MongoDB:", err));

const paymentsRouter = require("./controllers/paymentController");
app.use("/payments", paymentsRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  const mongoUri = process.env.MONGO_URI || "Not set";
  const dbName = require("mongoose").connection.db?.databaseName || "Unknown";
  
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    port: PORT,
    mongoUri: mongoUri.substring(0, 50) + "...", // truncate for security
    connectedDatabase: dbName
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});