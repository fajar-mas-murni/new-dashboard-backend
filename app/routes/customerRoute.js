const express = require("express");
const customerController = require("../controllers/customerController.js");

const router = express.Router();
const controller = customerController();

router.get("/customer", controller.getCustomers);

module.exports = router;
