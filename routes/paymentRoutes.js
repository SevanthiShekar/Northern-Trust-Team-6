const express = require("express");
const router = express.Router();
const { getPaymentStatus } = require("../controllers/paymentController");

router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "✅ Payment routes are working!",
        timestamp: new Date().toISOString()
    });
});

router.get("/:id", getPaymentStatus);

module.exports = router;