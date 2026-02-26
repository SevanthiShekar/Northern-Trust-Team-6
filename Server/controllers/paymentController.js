const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const Payment = require("../models/payments");

const startPaymentProcessing = (paymentId) => {
    const delayToStart = 2000;
    setTimeout(async () => {
        const payment = await Payment.findById(paymentId);
        if (!payment) return;
        payment.status = "PROCESSING";
        await payment.save();
        const processingDelay = Math.floor(Math.random() * 3000) + 2000;
        setTimeout(async () => {
            let finalStatus, isFraudulent, failureReason;
            if (payment.amount <= 0) {
                finalStatus = "FAILED";
                failureReason = "Invalid Amount";
            } else if (payment.amount > 10000) {
                finalStatus = "FAILED";
                isFraudulent = true;
                failureReason = "Fraud detected";
            } else {
                finalStatus = Math.random() > 0.5 ? "SUCCESS" : "FAILED";
            }
            await Payment.findByIdAndUpdate(paymentId, {
                status: finalStatus,
                isFraudulent: isFraudulent,
                failureReason: failureReason
            });
            console.log(finalStatus);
        }, processingDelay);
    }, delayToStart);
};

// create payment
router.post("/", async (req, res) => {
    const { amount, currency, customerId } = req.body;
    if (amount == null || !currency || !customerId) {
        return res.status(400).json({ success: false, message: "amount, currency and customerId are required" });
    }
    try {
        const payment = new Payment({ amount, currency, customerId });
        await payment.save();
        startPaymentProcessing(payment._id);
        res.status(201).json({ success: true, paymentId: payment._id });
    } catch (err) {
        console.error("Error creating payment:", err.message);
        res.status(500).json({ success: false, message: "Error creating payment", error: err.message });
    }
});

// retry
router.post("/:id/retry", async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
        if (payment.status !== "FAILED") return res.status(400).json({ success: false, message: "Only FAILED payments can be retried" });
        payment.retryCount += 1;
        payment.status = "CREATED";
        payment.failureReason = null;
        await payment.save();
        startPaymentProcessing(payment._id);
        res.json({ success: true, message: "Retry started" });
    } catch (err) {
        console.error("Error retrying payment:", err.message);
        res.status(500).json({ success: false, message: "Error retrying payment", error: err.message });
    }
});

// GET payment by ID - Siddhi's implementation
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Looking for payment with ID: ${id}`);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment ID format"
            });
        }

        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        res.status(200).json({
            _id: { $oid: payment._id.toString() },
            amount: payment.amount,
            currency: payment.currency,
            customerId: payment.customerId,
            status: payment.status,
            failureReason: payment.failureReason || null,
            retryCount: payment.retryCount,
            isFraudulent: payment.isFraudulent,
            createdAt: { $date: payment.createdAt.toISOString() },
            updatedAt: { $date: payment.updatedAt.toISOString() }
        });

    } catch (error) {
        console.error("🔥 Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching payment",
            error: error.message
        });
    }
});

module.exports = router;