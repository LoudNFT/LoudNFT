const mongoose = require("mongoose");
const shortid = require("shortid");
// const { default: Collectible } = require("../../metatest/src/components/Collectible");

// const Schema = mongoose.Schema;

const Collectible = mongoose.model(
  "collectibles",
  new mongoose.Schema({
    _id: { type: String, default: shortid.generate },
    contract_address: String,
    account: String,
    nfts: [
      {
        transaction_hash: String,
        gas_used: String,
        name: String,
        hash: String,
        by: String,
        image: String,
        description: String,
      },
    ],
  })
);

module.exports = Collectible;
