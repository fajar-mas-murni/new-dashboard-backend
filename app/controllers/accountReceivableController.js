const accountReceivableService = require("../services/accountReceivableService.js");

const service = accountReceivableService();

function accountReceivableController() {
  async function getArSummary(req, res, next) {
    try {
      const startDate = req.query["start-date"];
      const endDate = req.query["end-date"];
      const result = await service.getArSummary(startDate, endDate);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async function getPaidInvoicesSummary(req, res, next) {
    try {
      const startDate = req.query["start-date"];
      const endDate = req.query["end-date"];
      const result = await service.getPaidInvoicesSummary(startDate, endDate);

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error);
    }
  }

  async function getPaidVsUnpaidMonthly(req, res, next) {
    try {
      const startDate = req.query["start-date"] || req.query["start-data"];
      const endDate = req.query["end-date"];
      const result = await service.getPaidVsUnpaidMonthly(startDate, endDate);

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error);
    }
  }

  async function allInvoicesCustomers(req, res, next) {
    try {
      const startDate = req.query["start-date"];
      const endDate = req.query["end-date"];
      const result = await service.allInvoicesCustomers(startDate, endDate);

      res.status(200).json({
        success: true,
        succes: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async function allUmcThisMonth(req, res, next) {
    try {
      const startDate = req.query["start-date"];
      const endDate = req.query["end-date"];
      const result = await service.allUmcThisMonth(startDate, endDate);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  return {
    getArSummary,
    getPaidInvoicesSummary,
    getPaidVsUnpaidMonthly,
    allInvoicesCustomers,
    allUmcThisMonth
  };
}

module.exports = accountReceivableController;
