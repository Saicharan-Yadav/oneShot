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
    const { title, content, imageurl } = req.body;

    const user_mongoose_id = req.user.user_id;
    const newBlog = new blog({
      title: title,
      content: content,
      imageurl: imageurl,
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
  const blog_id = req.body.blog_id;
  try {
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
    await blog.updateOne(
      { _id: blog_id, author: userId },
      { $set: { title: title, content: content } }
    );
    res.status(200).json({ msg: "sucessfully updated" });
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

//pagination middleware

function pagination(model) {
  return async (req, res, next) => {
    try {
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const results = {};

      if (endIndex < (await model.countDocuments().exec())) {
        results.next = {
          page: page + 1,
          limit: limit,
        };
      } else {
        results.next = {
          page: page,
          limit: limit,
        };
      }

      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit: limit,
        };
      } else {
        results.previous = {
          page: 1,
          limit: limit,
        };
      }

      results.blogs = await model.find().limit(limit).skip(startIndex).exec();
      res.results = results;
      next();
    } catch (e) {
      res.status(404).json({ msg: e.message });
    }
  };
}

//pagination
//get all blogs
//using query params page=x& limit=y
router.get("/getall", pagination(blog), async (req, res) => {
  res.json(res.results);
});

router.get("/pagesCount", async (req, res) => {
  try {
    const count = await blog.countDocuments().exec();
    res.status(200).json({ count: count });
  } catch (e) {
    res.status(404).json({ msg: e.message });
  }
});

router.get("/profile", Authenticate, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const userDocument = await user.findOne({ _id: userId });
    res.json({ msg: userDocument });
  } catch (e) {
    res.status(404).json({ msg: e.message });
  }
});

router.post("/owner", Authenticate, async (req, res) => {
  const userId = req.user.user_id;
  const { blog_id } = req.body;

  try {
    const blogDocument = await blog.findOne({ _id: blog_id });
    if (blogDocument.author == userId) {
      res.status(200).json({ msg: "you are the owner of this blog" });
    } else {
      res.status(404).json({ msg: "you are not the owner of this blog" });
    }
  } catch (e) {
    res.status(404).json({ msg: e.message });
  }
});

module.exports = router;
