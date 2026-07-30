const express = require("express");
const branchController = require("../controllers/branchController.js");

const router = express.Router();
const controller = branchController();

router.get("/branch", controller.getBranch);

module.exports = router;
