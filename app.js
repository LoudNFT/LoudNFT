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
  "https://rinkeby.infura.io/v3/22b3a9c2b68f42abb593b0582461ed6d"
);

const User = require("./models/User");

// const sample = async () => {
//   const transactionHash =
//     "0x16865d3b742973dc3f545b90afb3fd044ba84b86b56dd6efa5185c4ae23e2344";
//   let myResult;
//   web3.eth.getTransaction(transactionHash, async function (error, result) {
//     myResult = result;

//     const a = web3.utils.hexToUtf8(myResult.input);
//     // const testData =
//     //   "0x53d9d9100000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000a6d9c5f7d4de3cef51ad3b7235d79ccc95114de5000000000000000000000000a6d9c5f7d4de3cef51ad3b7235d79ccc95114daa";
//     // const decodedData = abiDecoder.decodeMethod(testData);
//     // console.log(decodedData, "decoded");

//     var newString = Buffer.from(a, "utf-8").toString();
//     console.log(newString, "this is another");
//     // console.log(result, " this is result");
//   });
// };

// sample();

const axios = require("axios");

const FormData = require("form-data");
app.use(express.json());
app.use(cors());

// fs.unlink(myPath, (err) => {
//   if (err) {
//     console.error(err);
//     return;
//   }

//   //file removed
// });

/*
TO PIN FILE TO TEST NET AND GET FILE HASH
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
  // console.log(res.data, "this is hash of image");
  return res.data.IpfsHash;
};

/*
TO PIN METADATA TO TEST NET AND GET FILE HASH
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
  // console.log(res.data, "this is hash of metadata");
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
// const router = express.Router();
app.post("/upload", async (req, res, err) => {
  let myPath;
  upload(req, res, (err) => {
    console.log("Request file ---", req.file);
    myPath = `./public/uploads/${req.file.filename}`;
    console.log(myPath, "this is  myPath");
    res.status(201).json(myPath);
  });
});

app.post("/create_meta_data", async (req, res, next) => {
  //   console.log(req.body.imagePath, "this is the imagePath");
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

  // await ciqlJson.open("./data.json").set("image", "this is new image").save();
  // await ciqlJson.open("./data.json").set("image", "this is new image").save();
  // await ciqlJson.open("./data.json").set("image", "this is new image").save();
  //   console.log(metaDataURI, "thisisuri");

  fs.unlink(imagePath, (err) => {
    if (err) {
      console.log(err, "error");
      return;
    }
  });
  // console.log("this is metaData uri", metaData);
  res.status(201).json({
    metaDataURI: metaDataURI,
    imageHash: imageHash,
  });
});

mongoConnect((res) => {
  console.log("connection successfull!!!");
  app.listen(process.env.PORT || 5000);
});
