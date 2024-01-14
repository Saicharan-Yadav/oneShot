const mongoose = require("mongoose");
const db = "mongodb+srv://saiCharan:test123@oneshot.idiwbja.mongodb.net/";

const connectDB = async () => {
  try {
    await mongoose.connect(db);
    console.log("Connected to MongoDB");
  } catch (e) {
    console.error(e);
  }
};

module.exports = connectDB;
