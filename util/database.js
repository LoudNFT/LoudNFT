const mongoose = require("mongoose");
// const MongoClient = mongodb.MongoClient;

const mongoConnect = (callback) => {
  mongoose
    .connect(
      process.env.MONGODB_URL || "",

      {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
      }
    )
    .then((res) => {
      // console.log("connected");
      callback(res);
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = mongoConnect;
