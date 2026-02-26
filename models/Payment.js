const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        amount: { type: Number, required: true },
        currency: { type: String, required: true },
        customerId: { type: String, required: true },
        status: {
            type: String,
            enum: ["CREATED", "PROCESSING", "SUCCESS", "FAILED", "REFUNDED"],
            default: "CREATED",
        },
        failureReason: { type: String, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);