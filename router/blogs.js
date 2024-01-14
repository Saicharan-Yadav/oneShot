require("dotenv").config();
const express = require("express");
const router = express.Router();
const user = require("../dataBase/schema/userSchema");
const blog = require("../dataBase/schema/blogsSchema");
const jwt = require("jsonwebtoken");

const Authenticate = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ msg: "Unauthorized - Token missing" });
  }

  jwt.verify(token, process.env.jwt_acess_token, (err, user) => {
    if (err) {
      return res.status(403).json({ msg: "Forbidden - Invalid token" });
    }

    req.user = user;
    next();
  });
};

//create
router.post("/create", Authenticate, async (req, res) => {
  try {
    const { title, content } = req.body;
    console.log(req.user);

    const user_mongoose_id = req.user.user_id;
    const newBlog = new blog({
      title: title,
      content: content,
      author: user_mongoose_id,
    });
    await newBlog.save();

    let author_document = await user.findOne({ _id: user_mongoose_id });
    console.log(author_document);
    author_document.blog.push(newBlog._id);
    console.log(author_document);
    //await author_document.save();
    await user.updateOne(
      { _id: user_mongoose_id },
      {
        $set: { ...author_document },
      }
    );

    res.json({ msg: "sucesfully inserted" });
  } catch (e) {
    res.status(404).json({ msg: e.message });
  }
});

//edit

//delete

//get all blogs
router.get("/getall", async (req, res) => {
  try {
    const blogs = await blog.find();
    res.json(blogs);
  } catch (e) {
    res.json({ msg: e.message });
  }
});

module.exports = router;
