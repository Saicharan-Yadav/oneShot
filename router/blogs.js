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

    author_document.blog.push(newBlog._id);

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

const ownerAuthenticate = async (req, res, next) => {
  const userId = req.user.user_id;
  const { blog_id } = req.body;
  try {
    console.log(req.body);
    const blogDocument = await blog.findOne({ _id: blog_id });
    if (blogDocument.author == userId) {
      next();
    } else {
      res.status(404).json({ msg: "you are not the owner of this blog" });
    }
  } catch (e) {
    res.status(404).json({ msg: e.message });
  }
};

//edit
//only owner should edit
//owner ==>token ==>user_id ==> find blog id present or not ==>seperate atuthenticate function
router.put("/edit", Authenticate, ownerAuthenticate, async (req, res) => {
  const userId = req.user.user_id;
  const { title, content, blog_id } = req.body;
  try {
    // console.log(blog_id, userId);
    await blog.updateOne(
      { _id: blog_id, author: userId },
      { $set: { title: title, content: content } }
    );
    res.json({ msg: "sucessfully updated" });
  } catch (e) {
    res.status(404).json({ msg: e.message });
  }
});

//delete
router.post("/delete", Authenticate, ownerAuthenticate, async (req, res) => {
  const userId = req.user.user_id;
  const { blog_id } = req.body;
  try {
    await blog.deleteOne({ _id: blog_id, author: userId });
    await user.updateOne({ _id: userId }, { $pull: { blog: blog_id } });
    res.json({ msg: "sucessfully deleted" });
  } catch (e) {
    res.status(404).json({ msg: e.message });
  }
});

//pagination
//get all blogs
router.get("/getall", async (req, res) => {
  try {
    const blogs = await blog.find();
    res.json(blogs);
  } catch (e) {
    res.json({ msg: e.message });
  }
});

// like
//comment

module.exports = router;
