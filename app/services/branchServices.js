const { connectDB } = require("../configs/databaseConfig");

function branchService() {
    async function getBranches(search, page, pageSize) {
        const offset = (page - 1) * pageSize;
        let whereClause = "where type = 'OB' and status = 'A' and AcctCD not in ('01 BKS', '07 LSM')";

        if (search) {
            whereClause += ` and (AcctCD like '%${search}%' or AcctName like '%${search}%')`;
        }

        const countQuery = `
            select count(*) as total
            from baccount b
            ${whereClause}
        `;

        const dataQuery = `
            select BAccountID, AcctCD as BranchCode, AcctName as BranchName
            from baccount b
            ${whereClause}
            order by AcctName asc
            offset ${offset} rows
            fetch next ${pageSize} rows only
        `;

        const pool = await connectDB();
        const countResult = await pool.request().query(countQuery);
        const dataResult = await pool.request().query(dataQuery);

        return {
            data: dataResult.recordset,
            total: countResult.recordset[0].total,
            page,
            pageSize,
            totalPages: Math.ceil(countResult.recordset[0].total / pageSize)
        };
    }

    return { getBranches };
}

module.exports = branchService;