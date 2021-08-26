const dotenv = require("dotenv");
dotenv.config();

var express = require("express");
const app = express();
const bodyParser = require("body-parser");
var uniqid = require("uniqid");
var cors = require("cors");
const path = require("path");
const multer = require("multer");
const userRoutes = require("./routes/userRoutes");
const mongoConnect = require("./util/database");
app.use(express.urlencoded({ extended: false }));
const fs = require("fs");
const ciqlJson = require("ciql-json");
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_SECRET_KEY;
const Web3 = require("web3");
const abiDecoder = require("abi-decoder");
const web3 = new Web3(
  "https://speedy-nodes-nyc.moralis.io/58179be7c4a9b63cf4bac6a5/bsc/testnet"
);

const User = require("./models/User");

const axios = require("axios");

const FormData = require("form-data");
app.use(express.json());
app.use(cors());

/*
TO PIN FILE TO IPFS AND GET FILE HASH
*/

const pinFileToIPFS = async (myFilePath) => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  let data = new FormData();
  data.append("file", fs.createReadStream(myFilePath));
  const res = await axios.post(url, data, {
    maxContentLength: "Infinity",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretApiKey,
    },
  });

  return res.data.IpfsHash;
};

/*
TO PIN METADATA TO IPFS  AND GET FILE HASH
*/

const pinDataToIPFS = async () => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  let data = new FormData();
  data.append("file", fs.createReadStream("./data.json"));
  const res = await axios.post(url, data, {
    maxContentLength: "Infinity",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretApiKey,
    },
  });

  return res.data.IpfsHash;
};

app.use(userRoutes);
app.get("/", (req, res) => {
  res.send("hello world!");
});

const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function (req, file, cb) {
    cb(null, "IMAGE-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100000000 },
}).single("myImage");

app.post("/upload", async (req, res, err) => {
  let myPath;
  upload(req, res, (err) => {
    console.log("Request file ---", req.file);
    myPath = `./public/uploads/${req.file.filename}`;

    res.status(201).json(myPath);
  });
});

/*
METADATA CREATION API
*/

app.post("/create_meta_data", async (req, res, next) => {
  const imagePath = req.body.imagePath;
  const imageHash = await pinFileToIPFS(imagePath);

  ciqlJson
    .open("./data.json")
    .set("image", `https://ipfs.io/ipfs/${imageHash}`)
    .set("name", req.body.name)
    .set("by", req.body.creator)
    .set("description", req.body.description)
    .set("hash", imageHash)
    .set("cover", req.body.cover)
    .set("type", "Music")
    .save();

  const metaDataHash = await pinDataToIPFS();

  const metaDataURI = `https://ipfs.io/ipfs/${metaDataHash}`;

  fs.unlink(imagePath, (err) => {
    if (err) {
      console.log(err, "error");
      return;
    }
  });

  res.status(201).json({
    metaDataURI: metaDataURI,
    imageHash: imageHash,
  });
});

/*
 CONNECT TO MONGODB
*/

mongoConnect((res) => {
  console.log("connection successfull!!!");
  app.listen(process.env.PORT || 5000);
});
