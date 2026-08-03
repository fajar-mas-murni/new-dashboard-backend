const { connectDB } = require("../configs/databaseConfig");

function customerService() {
    async function getCustomers(search, category, page, pageSize) {
        const offset = (page - 1) * pageSize;
        let whereClause = "where companyid = 2 and acctcd like 'CUS%' and Status = 'A'";

        if (search) {
            whereClause += ` and (AcctCD like '%${search}%' or AcctName like '%${search}%')`;
        }

        if (category === "anak_usaha") {
            whereClause += ` and (AcctName like '%Mitra Atlas Nusantara%' or AcctName like '%Fajar Bumi Harmoni%' or AcctName like '%Fajar Mitra Harmoni%' or AcctName like '%Fajar Rawayan Utama%')`;
        } else if (category === "non_anak_usaha") {
            whereClause += ` and not (AcctName like '%Mitra Atlas Nusantara%' or AcctName like '%Fajar Bumi Harmoni%' or AcctName like '%Fajar Mitra Harmoni%' or AcctName like '%Fajar Rawayan Utama%')`;
        }

        const countQuery = `
            select count(distinct BAccountID) as total
            from baccount as b
            ${whereClause}
        `;

        const dataQuery = `
            select distinct BAccountID, AcctCD as CustomerCode, AcctName as CustomerName
            from baccount as b
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

    return { getCustomers };
}

module.exports = customerService;