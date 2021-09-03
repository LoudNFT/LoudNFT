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
const Nft = require("./models/Nft");
// const User = require("./models/User");

const Contract = require("./contractAbi");

/*
CONNECTING RPC NODE BSC-TESTNET (CHANGE FOR MAINNET)
*/

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

/*TRANSFER TOKEN*/
app.post("/change_check", async (req, res, next) => {
  const updateNftOfFromAddress = await User.updateOne(
    {
      wallet_address: `${req.body.fromAddress.toLowerCase()}`,
      "nfts.token_id": `${req.body.tokenId}`,
    },
    {
      $set: {
        "nfts.$.owner": req.body.toAddress,
        "nfts.$.on_sale": false,
      },
    }
  );

  const nftOwnerUpdate = await Nft.findOneAndUpdate(
    { token_id: `${req.body.tokenId}` },
    {
      $set: {
        owned_by: req.body.toAddress,
        on_sale: false,
        initial_price: "",
      },
    },
    { new: true, useFindAndModify: false }
  );

  console.log(updateNftOfFromAddress, "aftre update");
  console.log("changed", nftOwnerUpdate);
});

app.post("/transfer_nft", async (req, res, next) => {
  const networkId = await web3.eth.net.getId();
  const account = web3.eth.accounts.wallet.add(
    "7dab73e7972809180de4c0fece05f1a1fc01eed41e6267f2946e846690371a88"
  );

  const myContract = new web3.eth.Contract(
    Contract.contractAbi,
    "0xC27CA64B9E42b60cf92AA365457d3d9DB214566C"
  );

  console.log(account);

  const tx = await myContract.methods
    .transferFrom(req.body.fromAddress, req.body.toAddress, req.body.tokenId)
    .send({ from: account.address, gas: 470000 })
    .on("transactionHash", async function (hash) {
      console.log(hash, "this is hash");

      let newTx = {
        from: req.body.fromAddress,
        to: req.body.toAddress,
        tx_hash: hash,
        sold_for: req.body.amount,
      };

      let newNft = {
        token_id: req.body.tokenId,
        tx_hash: hash,
        creator: req.body.creator,
        owner: req.body.toAddress,
        on_sale: false,
        initial_price: "",
        music: req.body.music,
        cover_image: req.body.cover_image,
      };

      const nft = await Nft.findOneAndUpdate(
        { token_id: `${req.body.tokenId}` },
        {
          $push: {
            tx_history: newTx,
          },
        },
        { new: true, useFindAndModify: false }
      );

      let fromActivity = {
        activity_type: "token_sale",
        date: Date.now().toString(),
        tx_hash: hash,
        token_id: req.body.tokenId,
        to_address: req.body.toAddress,
      };

      let toActivity = {
        activity_type: "token_buy",
        date: Date.now().toString(),
        tx_hash: hash,
        token_id: req.body.tokenId,
        from_address: req.body.fromAddress,
      };

      const fromAddress = await User.findOneAndUpdate(
        { wallet_address: `${req.body.fromAddress.toLowerCase()}` },
        {
          $push: {
            activity: fromActivity,
          },
        },
        { new: true, useFindAndModify: false }
      );

      const toAddressNft = await User.findOneAndUpdate(
        {
          wallet_address: `${req.body.toAddress.toLower()}`,
        },
        {
          $push: {
            nfts: newNft,
          },
        },
        { new: true, useFindAndModify: false }
      );

      const toAddress = await User.findOneAndUpdate(
        { wallet_address: `${req.body.toAddress.toLower()}` },
        {
          $push: {
            activity: toActivity,
          },
        },
        { new: true, useFindAndModify: false }
      );

      const updateNftOfFromAddress = await User.updateOne(
        {
          wallet_address: `${req.body.fromAddress.toLowerCase()}`,
          "nfts.token_id": `${req.body.tokenId}`,
        },
        {
          $set: {
            "nfts.$.owner": req.body.toAddress,
            "nfts.$.on_sale": false,
          },
        }
      );

      const nftOwnerUpdate = await Nft.findOneAndUpdate(
        { token_id: `${req.body.tokenId}` },
        {
          $set: {
            owned_by: req.body.toAddress,
            on_sale: false,
            initial_price: "",
          },
        },
        { new: true, useFindAndModify: false }
      );

      console.log(nft, "updated nft");
      console.log(fromAddress, "updated nft");
      console.log(toAddress, "updated nft");
    });

  // const gasPrice = await web3.eth.getGasPrice();

  // const gas = await tx.estimateGas({
  //   from: "0x9b45d32e89de016319a32ccb281e3915b2114f53",
  // });
  // const data = tx.encodeABI();
  // const nonce = await web3.eth.getTransactionCount(
  //   "0x9b45d32e89de016319a32ccb281e3915b2114f53"
  // );

  // const signedTx = await web3.eth.accounts.signTransaction(
  //   {
  //     to: req.body.toAddress,
  //     data,
  //     gas,
  //     gasPrice,
  //     nonce,
  //     chainId: networkId,
  //   },
  //   "7dab73e7972809180de4c0fece05f1a1fc01eed41e6267f2946e846690371a88"
  // );

  // console.log(
  //   `Old data value: ${await myContract.methods
  //     .ownerOf(req.body.tokenId)
  //     .call()}`
  // );
  // const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  // console.log(`Transaction hash: ${receipt.transactionHash}`);
  // console.log(
  //   `New data value: ${await myContract.methods
  //     .ownerOf(req.body.tokenId)
  //     .call()}`
  // );

  // console.log("this is gas", gas);
  // const receipt = await web3.eth.sendTransaction(txData);

  console.log("completed");

  res.send("success");
});

/*
 CONNECT TO MONGODB
*/

mongoConnect((res) => {
  console.log("connection successfull!!!");
  app.listen(process.env.PORT || 80);
});
