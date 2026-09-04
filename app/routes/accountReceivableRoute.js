const express = require("express");
const dashboardController = require("../controllers/accountReceivableController.js");
const payloadValidationMiddleware = require("../middlewares/payloadValidationMiddleware.js");

const router = express.Router();
const controller = dashboardController();

router.get("/summary", controller.getArSummary);
router.get("/paid-invoices-summary", controller.getPaidInvoicesSummary);
router.get("/paid-vs-unpaid-monthly", controller.getPaidVsUnpaidMonthly);
router.get("/customer-invoices", controller.allInvoicesCustomers);
router.get("/all-invoices-customers", controller.allInvoicesCustomers);
router.get("/all-umc-this-month", controller.allUmcThisMonth);
router.get("/umc-this-month", controller.allUmcThisMonth);

module.exports = router;
