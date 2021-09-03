const User = require("../models/User");
const Admin = require("../models/Admin");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error.js");
var uniqid = require("uniqid");

const Admin = require("../models/Admin");

const verify = (req) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; //Authorization: "Bearer Token"
    if (!token) {
      const error = new HttpError("Authentication failed!", 401);
      return next(error);
    }

    const decodedToken = jwt.verify(token, "#lkcnads-0qi45-23vf4=f4!#$%");
    req.userData = { userId: decodedToken.userId };

    return "success";
  } catch (err) {
    return "error";
  }
};

exports.checkAdmin = async (req, res, next) => {
  const check = await verify(req);
  if (check !== "success") {
    const error = new HttpError("Authentication failed!", 401);
    return next(error);
  } else {
    res.status(200).json({ message: "success" });
  }
};

exports.changeStatus = async (req, res, next) => {
  console.log(req.body, "inside this");
  try {
    Admin.findOneAndUpdate(
      { email: `${req.body.email}` },
      {
        $set: {
          status: req.body.status,
        },
      },
      { new: true, useFindAndModify: false }
    )
      .then((docs) => res.status(200).json({ message: "success" }))
      .catch((err) => console.log(err));
  } catch (err) {
    const error = new HttpError("some error occcurred", 500);
    return next(error);
  }
};

exports.adminCreate = async (req, res, next) => {
  // console.log(req.body);
  let hashedPassword;
  //   const userExist = await Admin.find({ email: `${req.body.email}` });

  //   if (userExist.length !== 0) {
  //     res.json("user already exists!");
  //     return;
  //   }

  try {
    hashedPassword = await bcrypt.hash(req.body.password, 15);
  } catch (err) {
    const error = new HttpError("Could not create user, please try again", 500);
    return next(error);
  }

  let newAdmin;
  newAdmin = {
    user_id: "0001",
    fullname: "the_super_admin",
    email: "",
    password: hashedPassword,
    ip_address: "",
  };

  const createdAdmin = new Admin(newAdmin);
  const savedAdmin = await createdAdmin.save();

  res.status(201).json({
    userId: savedAdmin.user_id,
    email: savedAdmin.email,
  });
};

exports.adminLogin = async (req, res, next) => {
  const admin = await Admin.find({ fullname: `${req.body.fullname}` });

  if (admin.length === 0) {
    const error = new HttpError("User Does not exists", 500);
    return next(error);
  }

  let validPassword = false;
  try {
    validPassword = await bcrypt.compare(req.body.password, admin[0].password);
  } catch (err) {
    const error = new HttpError("some error occurred", 500);
    return next(error);
  }
  if (!validPassword) {
    const error = new HttpError("password did not match", 500);
    return next(error);
  } else {
    let token;
    try {
      token = jwt.sign(
        { userId: admin[0].user_id, email: admin[0].email },
        "supersecret_of_rio_exchange",
        { expiresIn: "3h" }
      );

      res.status(201).json({
        email: admin[0].email,
        fullname: admin[0].fullname,

        token: token,
      });
    } catch (err) {
      const error = new HttpError(
        "Login failed, please enter valid credentials",
        500
      );
      return next(error);
    }
  }
};

exports.tokenTransfer = async (req, res, next) => {};
