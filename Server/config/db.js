const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: "Payment_Gateway_Stimulation",
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        console.log(`MongoDB Connected: Database Connection Successful`);
        console.log(`Connected to database: ${conn.connection.db.databaseName}`);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;