const branchServices = require("../services/branchServices");

const service = branchServices();

function branchController() {
    async function getBranch(req, res, next) {
        try {
            const search = req.query.search || "";
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 10;

            const result = await service.getBranches(search, page, pageSize);

            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    return { getBranch };
}

module.exports = branchController;