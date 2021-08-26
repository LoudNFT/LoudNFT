const mongoose = require("mongoose");
const shortid = require("shortid");

const User = mongoose.model(
  "users",
  new mongoose.Schema({
    _id: { type: String, default: shortid.generate },
    wallet_address: String,
    blockchain: String,
    profile_image: String,
    bio: String,

    collectibles: [
      {
        _id: { type: String, default: shortid.generate },
        name: String,
        nfts: [
          {
            _id: { type: String, default: shortid.generate },
            token_id: String,
          },
        ],
      },
    ],
    nfts: [
      {
        _id: { type: String, default: shortid.generate },
        token_id: String,
        tx_hash: String,
        creator: String,
        owner: String,
        initial_price: String,
        on_sale: Boolean,
        music: String,
        cover_image: String,
      },
    ],
    activity: [
      {
        _id: { type: String, default: shortid.generate },
        activity_type: String,
        date: String,
        by: String,
      },
    ],
    following: [
      {
        _id: { type: String, default: shortid.generate },
        wallet_address: String,
      },
    ],

    followers: [
      {
        _id: { type: String, default: shortid.generate },
        wallet_address: String,
      },
    ],
  })
);

module.exports = User;
