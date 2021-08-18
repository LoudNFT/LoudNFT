const User = require("../models/User");
const Collectible = require("../models/Collectible");

exports.checkUser = async (req, res, next) => {
  console.log(req.body.user, "here");
  const userExist = await User.find({
    wallet_address: `${req.body.user.toLowerCase()}`,
  });
  if (userExist.length !== 0) {
    res.json("user already exists!");
    return;
  } else {
    res.json("notfound");
    return;
  }
};

exports.getUserDetails = async (req, res, next) => {
  // console.log(req.body);
  const userExist = await User.find({
    wallet_address: `${req.body.user.toLowerCase()}`,
  });

  if (userExist.length === 0) {
    res.json("some Error occurred");
    return;
  }
  console.log(userExist, "this is user Exist!!");
  res.json(userExist[0]);
};

exports.saveUser = async (req, res, next) => {
  // console.log(req.body.user);
  const userExist = await User.find({
    wallet_address: `${req.body.user.toLowerCase()}`,
  });

  if (userExist.length !== 0) {
    res.json("user already exists!");
    return;
  }

  let newUser = {
    wallet_address: req.body.user.toLowerCase(),
    blockchain: req.body.blockchain,
    collectibles: [],
    nfts: [],
    profile_image: "",
    following: [],
    followers: [],
  };
  const createdUser = new User(newUser);
  const savedUser = await createdUser.save();

  //   console.log();

  res.status(201).json({
    message: "success",
    user: savedUser.wallet_address,
    blockchain: savedUser.blockchain,
    collectibles: [],
    nfts: [],
    profile_image: "",
    following: [],
    following: [],
  });
};

exports.getCollectibles = async (req, res, next) => {
  const user = await User.find({
    wallet_address: `${req.body.wallet_address}`,
  });

  console.log(user, "this is user");

  if (user.length !== 0) {
    // console.log(user[0].collectibles, "this is collectible");
    res.status(201).json({
      collectibles: user[0].collectibles,
    });
  } else {
    res.status(201).json({
      message: "user not found!",
    });
  }
};

exports.addTokenInfo = async (req, res, next) => {
  console.log("Inside add Token Info");
  let userAddr = req.body.owner;

  let currentDate = new Date();

  console.log(currentDate.toString(), "this is date");

  // return;

  console.log("this is the req", userAddr);
  const user = await User.find({
    wallet_address: req.body.owner,
  });
  console.log(user, "this is user");

  if (user.length === 0) {
    const newUser = {
      wallet_address: req.body.owner,
      blockchain: "ropsten",
      nfts: [
        {
          token_id: req.body.tokenId,
          tx_hash: req.body.txHash,
        },
      ],
    };
    res.send("success");
  } else {
    const updatedUser = await User.findOneAndUpdate(
      { wallet_address: `${req.body.owner.toLowerCase()}` },
      {
        $push: {
          nfts: {
            token_id: req.body.tokenId,
            tx_hash: req.body.txHash,
            intial_price: req.body.intialPrice,
            owner: req.body.owner,
            creator: req.body.owner,
            on_sale: req.body.onSale,
            music: req.body.music,
          },
        },
      },
      { new: true, useFindAndModify: false }
    );

    const updatedUserActivity = await User.findOneAndUpdate(
      { wallet_address: `${req.body.owner.toLowerCase()}` },
      {
        $push: {
          activity: {
            activity_type: "Minting",
            date: currentDate.toString(),
            by: req.body.owner.toLowerCase(),
          },
        },
      },
      { new: true, useFindAndModify: false }
    );
    // console.log(updateUserActivity);
    res.send("success");
  }
};

exports.createCollectibles = async (req, res, next) => {
  // const user = await User.find({
  //   wallet_address: `${req.body.wallet_address}`,
  // });
  console.log("inside newCollectible", req.body);

  const low_wallet_address = req.body.wallet_address.toLowerCase();

  // console.log(low_contract_address, "low");
  const firstCollectible = {
    contract_address: req.body.contract_address,
    block_hash: req.body.blockHash,
    from: req.body.from,
    // block_number: req.body.blockNumber,
    transaction_hash: req.body.transactionHash,
    gas_used: req.body.gas_used,
  };

  // console.log("first newCollectible", firstCollectible);
  const user = await User.findOneAndUpdate(
    { wallet_address: `${low_wallet_address}` },
    {
      $push: {
        collectibles: firstCollectible,
      },
    },
    { new: true, useFindAndModify: false }
  );

  anothernewCollectible = {
    contract_address: req.body.contract_address,
    account: req.body.wallet_address,
    nfts: [],
  };

  const collectible = new Collectible(anothernewCollectible);
  const savedCollectible = await collectible.save();

  res.status(201).json({
    collectibles: user.collectibles,
    message: "success",
  });
};
