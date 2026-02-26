const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be greater than 0"]
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
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

    retryCount: {
        type: Number,
        default: 0
    },

    isFraudulent: {
        type: Boolean,
        default: false
    }
  },
  {
    timestamps: true // adds createdAt & updatedAt automatically
  }
);

module.exports = mongoose.model("Payment", paymentSchema);