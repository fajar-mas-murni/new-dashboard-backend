const express = require("express");
const dashboardController = require("../controllers/accountReceivableController.js");
const payloadValidationMiddleware = require("../middlewares/payloadValidationMiddleware.js");

const router = express.Router();
const controller = dashboardController();

router.get("/summary", controller.getArSummary);

module.exports = router;
