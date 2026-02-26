const mongoose = require("mongoose");
const Payment = require("../models/payments");

exports.getPaymentStatus = async (req, res) => {
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
};