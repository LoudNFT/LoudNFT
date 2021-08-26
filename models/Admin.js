const mongoose = require("mongoose");
const shortid = require("shortid");

const Admin = mongoose.model(
  "admin",
  new mongoose.Schema({
    _id: { type: String, default: shortid.generate },
    user_id: String,
    fullname: String,
    email: String,
    password: String,
    picture: String,
    sign_in: String,
    isVerified: String,
    ip_address: String,
  })
);

module.exports = Admin;
