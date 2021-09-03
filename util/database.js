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
      callback(res);
    })
    .catch((err) => {
      console.log(err, "error");
    });
};

module.exports = mongoConnect;
