require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Payment Gateway API Running");
});

app.use("/payments", paymentRoutes);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});