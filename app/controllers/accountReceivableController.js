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

  return { getArSummary };
}

module.exports = accountReceivableController;
