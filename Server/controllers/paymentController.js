const express = require("express");
const router = express.Router();
const Payment = require("../models/payments");

const startPaymentProcessing = (paymentId) => {
    // console.log("calling processing")
    const delayToStart = 2000

    setTimeout(async () => {

        const payment = await Payment.findById(paymentId)
        if (!payment) return

        payment.status = "PROCESSING"
        await payment.save()

        const processingDelay = Math.floor(Math.random() * 3000) + 2000

        setTimeout(async () => {

            let finalStatus, isFraudulent, failureReason
            // console.log("calling setting")
            if (payment.amount <= 0) {
                finalStatus = "FAILED"
                failureReason = "Invalid Amount"

            }
            else if (payment.amount > 10000) {
                finalStatus = "FAILED"
                isFraudulent = true
                failureReason = "Fraud detected"
            }
            else {
                finalStatus = Math.random() > 0.5 ? "SUCCESS" : "FAILED"
            }

            await Payment.findByIdAndUpdate(paymentId, {
                status: finalStatus,
                isFraudulent: isFraudulent,
                failureReason: failureReason
            })

            console.log(finalStatus)
            // console.log("completed setting")
            // console.log("completed processing")

        }, processingDelay)

    }, delayToStart)
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
        console.log(`Webhook: payment ${payment._id} status changed to REFUNDED`);
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
            success: true,
            data: payment
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

// simple test route
router.get("/test", (req, res) => {
    console.log("Route /test hit");
    res.status(200).json({ message: "Test successful" });
});

module.exports = router;