const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Connected: Database Connection Successful`);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1); // Exit if DB fails
    }
};

module.exports = connectDB;