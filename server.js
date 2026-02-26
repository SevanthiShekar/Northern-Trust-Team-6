require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db")
const paymentController = require("./controllers/paymentController");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.post("/payments", paymentController.createPayment);

// Test route
app.get("/", (req, res) => {
    res.send("Payment Gateway API Running");
});

const PORT = 5000;
app.post("/test-route", (req, res) => {
  res.send("TEST ROUTE WORKING");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});