const customerServices = require("../services/customerService");

const service = customerServices();

function customerController() {
    async function getCustomers(req, res, next) {
        try {
            const search = req.query.search || "";
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;

            const result = await service.getCustomers(search, page, pageSize);

            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    return { getCustomers };
}

module.exports = customerController;