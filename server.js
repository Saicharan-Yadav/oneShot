const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;
const loginSignUpRouter = require("./router/loginSignUp");
const connectDB = require("./dataBase/connect");
connectDB();

app.use(cors());
app.use(express.json());

app.use("/", loginSignUpRouter);

app.listen(port, () => {
  console.log("Server Runnig on port " + port);
});
