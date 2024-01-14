const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const passwordValidator = require("password-validator");

let passwordSchema = new passwordValidator();
passwordSchema
  .is()
  .min(8)
  .is()
  .max(100)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .digits(1)
  .has()
  .not()
  .spaces()
  .is()
  .not()
  .oneOf(["Passw0rd", "Password123"]);

const validatePassword = (pass) => {
  return passwordSchema.validate(pass);
};

const userSchema = new mongoose.Schema({
  email: {
    type: "String",
    unique: true,
    require: true,
    trim: true,
    lowercase: true,
    match: [
      /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
      "Please enter a valid email address",
    ],
  },
  password: {
    type: "String",
    required: true,
    minLength: 8,
    maxLength: 20,
    validate: [
      validatePassword,
      "follow the Below Given rules to Generate a Password",
    ],
  },
});
userSchema.pre("save", async function (next) {
  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("user", userSchema);
