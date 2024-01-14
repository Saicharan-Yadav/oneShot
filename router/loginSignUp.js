require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const user = require("../dataBase/schema/userSchema");
const jwt = require("jsonwebtoken");

//login
router.post("/", async (req, res) => {
  const { email, password } = req.body;
  const users = await user.findOne({ email });
  if (!users) {
    return res.status(400).json({ msg: "no user found " });
  } else {
    const isMatch = await bcrypt.compare(password, users.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "invalid credentials" });
    } else {
      const acessToken = jwt.sign(
        { users: users },
        process.env.jwt_acess_token,
        {
          expiresIn: "15m",
        }
      );
      return res.status(200).json({ acessToken: acessToken });
    }
  }
});

router.post("/signup", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const retypePassword = req.body.retypePassword;
  if (retypePassword != password) {
    res.send({ error: "Passwords are not matching" });
  } else {
    try {
      const mail = await user.findOne({ email });
      if (mail) {
        return res.status(400).json({ error: "Username already exists" });
      }
      //   console.log("1");
      const newUser = new user({ email, password });
      //   console.log(newUser);
      //   console.log("2");
      await newUser.save();
      res.status(201).json({ msg: "User created successfully" });
    } catch (error) {
      res.status(500).json({ msg: error.message.split(":")[2] });
    }
  }
});

module.exports = router;
