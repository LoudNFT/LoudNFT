var express = require("express");
var router = express.Router();
const adminController = require("../controllers/Admin");

router.post("/adminCreate", adminController.adminCreate);

router.post("/admin_login", adminController.adminLogin);

router.get("/check_admin", adminController.checkAdmin);

router.post("/change_user_status", adminController.changeStatus);

router.post("/admin_details", adminController.getAdminDetails);

module.exports = router;
