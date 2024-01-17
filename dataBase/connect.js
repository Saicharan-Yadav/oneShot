require("dotenv").config();
const mongoose = require("mongoose");
const db = process.env.db_url;

const connectDB = async () => {
  try {
    await mongoose.connect(db);
    console.log("Connected to MongoDB");
  } catch (e) {
    console.error(e);
  }
};

module.exports = connectDB;
