const express = require("express");
const router = express.Router();
const Payment = require("../models/payments");
// simple http client for delivering webhook callbacks
const axios = require("axios");

// ------------------------------------------------------------------
// payment processing simulation (same logic as before)
// ------------------------------------------------------------------
const fraudLimit = 10000;

// send a webhook POST if WEBHOOK_URL is configured; payload is any serializable object
async function deliverWebhook(payload) {
    // always log what we are about to send (or would send)
    console.log("(webhook) payload ->", payload);
    const url = process.env.WEBHOOK_URL;
    if (!url) {
        console.log("(webhook) no URL configured, skipping HTTP delivery");
        return;
    }
    try {
        await axios.post(url, payload, { timeout: 5000 });
        console.log("(webhook) delivered to", url);
    } catch (err) {
        console.error("(webhook) delivery failed:", err.message);
    }
}

// ------------------------------------------------------------------
// payment processing simulation (same logic as before)
// each time the status changes we both log and attempt to POST a
// callback to the configured WEBHOOK_URL (if any).
// ------------------------------------------------------------------
async function simulateProcessing(paymentId) {
    try {
        await Payment.findByIdAndUpdate(paymentId, { status: "PROCESSING" });
        console.log(`Payment ${paymentId} moved to PROCESSING`);
        setTimeout(async () => {
            const payment = await Payment.findById(paymentId);
            if (!payment) return;
            let update = {};
            if (payment.amount <= 0) {
                update.status = "FAILED";
                update.failureReason = "Invalid amount";
            } else if (payment.amount > fraudLimit) {
                update.status = "FAILED";
                update.failureReason = "Fraud detected";
            } else {
                if (Math.random() < 0.8) {
                    update.status = "SUCCESS";
                } else {
                    update.status = "FAILED";
                    update.failureReason = "Random failure";
                }
            }
            await Payment.findByIdAndUpdate(paymentId, update);
            console.log(`Payment ${paymentId} completed with status ${update.status}`);
            // log the status change event itself
            console.log(`(webhook) status changed to ${update.status} for ${paymentId}`);
            const webhookPayload = { success: true, paymentId, status: update.status };
            await deliverWebhook(webhookPayload);
        }, 1000 + Math.random() * 2000);
    } catch (err) {
        console.error("Error in simulateProcessing:", err.message);
    }
}

// create payment
router.post("/", async (req, res) => {
    const { amount, currency, customerId } = req.body;
    if (amount == null || !currency || !customerId) {
        return res.status(400).json({ success: false, message: "amount, currency and customerId are required" });
    }
    try {
        const payment = new Payment({ amount, currency, customerId });
        await payment.save();
        simulateProcessing(payment._id);
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
        simulateProcessing(payment._id);
        res.json({ success: true, message: "Retry started" });
    } catch (err) {
        console.error("Error retrying payment:", err.message);
        res.status(500).json({ success: false, message: "Error retrying payment", error: err.message });
    }
});

// refund
router.post("/:id/refund", async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
        if (payment.status !== "SUCCESS") return res.status(400).json({ success: false, message: "Only SUCCESS payments can be refunded" });
        payment.status = "REFUNDED";
        await payment.save();
        console.log(`(webhook) status changed to REFUNDED for ${payment._id}`);
        const webhookPayload = { success: true, paymentId: payment._id, status: "REFUNDED" };
        await deliverWebhook(webhookPayload);
        res.json({ success: true, message: "Refunded" });
    } catch (err) {
        console.error("Error refunding payment:", err.message);
        res.status(500).json({ success: false, message: "Error refunding payment", error: err.message });
    }
});

// fetch all
router.get("/", async (req, res) => {
    console.log("GET /payments called");
    try {
        const payments = await Payment.find();
        console.log(`Found ${payments.length} payments`);
        res.status(200).json({ success: true, count: payments.length, data: payments });
    } catch (err) {
        console.error("Error fetching payments:", err.message);
        res.status(500).json({ success: false, message: "Error fetching payments", error: err.message });
    }
});

// raw fetch
router.get("/raw", async (req, res) => {
    console.log("GET /payments-raw called");
    try {
        const db = require("mongoose").connection.db;
        const allPayments = await db.collection("payments").find({}).toArray();
        console.log(`Found ${allPayments.length} raw payments`);
        res.status(200).json({ success: true, count: allPayments.length, data: allPayments });
    } catch (err) {
        console.error("Error fetching raw payments:", err.message);
        res.status(500).json({ success: false, message: "Error fetching raw payments", error: err.message });
    }
});

// summary
router.get("/summary", async (req, res) => {
    console.log("GET /payments/summary called");
    try {
        const summary = await Payment.aggregate([
            {
                $facet: {
                    totalCount: [{ $count: "count" }],
                    successCount: [{ $match: { status: "SUCCESS" } }, { $count: "count" }],
                    failureCount: [{ $match: { status: "FAILED" } }, { $count: "count" }],
                    processingCount: [{ $match: { status: "PROCESSING" } }, { $count: "count" }],
                    refundedCount: [{ $match: { status: "REFUNDED" } }, { $count: "count" }],
                    createdCount: [{ $match: { status: "CREATED" } }, { $count: "count" }],
                    failureBreakdown: [
                        { $match: { status: "FAILED" } },
                        { $group: { _id: "$failureReason", count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ]
                }
            }
        ]);
        const result = summary[0];
        res.status(200).json({
            success: true,
            data: {
                totalPayments: result.totalCount[0]?.count || 0,
                successCount: result.successCount[0]?.count || 0,
                failureCount: result.failureCount[0]?.count || 0,
                processingCount: result.processingCount[0]?.count || 0,
                refundedCount: result.refundedCount[0]?.count || 0,
                createdCount: result.createdCount[0]?.count || 0,
                failureBreakdown: result.failureBreakdown.reduce((acc, item) => {
                    acc[item._id || "Unknown"] = item.count;
                    return acc;
                }, {})
            }
        });
    } catch (err) {
        console.error("Error fetching payment summary:", err.message);
        res.status(500).json({ success: false, message: "Error fetching payment summary", error: err.message });
    }
});

// get by id
router.get("/:id", async (req, res) => {
    console.log(`GET /payments/${req.params.id} called`);
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }
        res.status(200).json({ success: true, data: payment });
    } catch (err) {
        console.error("Error fetching payment:", err.message);
        res.status(500).json({ success: false, message: "Error fetching payment", error: err.message });
    }
});

// simple test route
router.get("/test", (req, res) => {
    console.log("Route /test hit");
    res.status(200).json({ message: "Test successful" });
});

module.exports = router;