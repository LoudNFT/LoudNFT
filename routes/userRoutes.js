var express = require("express");
var router = express.Router();
const UserController = require("../controllers/User");

router.post("/get_collectibles", UserController.getCollectibles);

router.post("/check_user", UserController.checkUser);

router.post("/create", UserController.saveUser);

router.post("/get_user_details", UserController.getUserDetails);
// router.post("/create_user", UserController.saveUser);

router.post("/create_new_collectible", UserController.createCollectibles);

router.post("/add_token_info", UserController.addTokenInfo);

router.post("/get_top_music");

router.post("/get_top_art");

router.post("/get_live_auction");

router.post("/");

module.exports = router;
