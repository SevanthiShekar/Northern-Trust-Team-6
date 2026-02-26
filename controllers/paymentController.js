const Payment = require('../models/payments');

exports.createPayment = async (req, res) => {
    try {
        const { amount, currency, customerId } = req.body;

        const newPayment = new Payment({
            amount,
            currency,
            customerId,
            status: 'CREATED'
        });

        const savedPayment = await newPayment.save();

        res.status(201).json({
            paymentId: savedPayment._id,
            status: savedPayment.status
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};