const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be greater than 0"] // extra validation
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,  // extra validation
      trim: true
    },

    customerId: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["CREATED", "PROCESSING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "CREATED"
    },

    failureReason: {
      type: String,
      default: null
    },

    retryCount: {          // extra field from dev
        type: Number,
        default: 0
    },

    isFraudulent: {        // extra field from dev
        type: Boolean,
        default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Payment", paymentSchema);