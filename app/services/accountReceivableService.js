const axios_instance = require("../configs/axiosConfig.js");
const { connectDB } = require("../configs/databaseConfig.js");
const generalLogger = require("../configs/loggerConfig.js");
const logger = generalLogger();

function accountReceivableService() {
  const cache = new Map();

  async function _getArData(endpoint, startDate, endDate) {
    const cacheKey = `${startDate || ''}_${endDate || ''}`;

    if (!cache.has(cacheKey)) {
      const promise = (async () => {
        try {
          const config = {};

          if (startDate && endDate) {
            config["params"] = {
              "$filter": `Date gt datetime'${startDate}' and Date lt datetime'${endDate}'`
            };
          }

          const response = await axios_instance.get(endpoint, config);

          return response.data.value;
        } catch (error) {
          cache.delete(cacheKey);

          throw error;
        }
      })();

      cache.set(cacheKey, promise);
    }

    return cache.get(cacheKey);
  }

  async function getUnpaidData(startDate, endDate) {
    return (await _getArData("/AR TRADE 180", startDate, endDate)) || [];
  }

  async function getArSummary(startDate, endDate) {
    const arData = await _getArData("/AR TRADE 180", startDate, endDate) || [];
    const result = {
      "summary": [],
      "top-10-unpaid-customers": [],
      "summary-customer": [],
      "summary-unpaid": [],
      "paid-vs-unpaid-monthly": []
    };
    const summaryTemp = new Map();
    const customerTemp = new Map();

    arData.forEach(dt => {
      summaryData(dt, summaryTemp);
      totalUnpaidCustomers(dt, customerTemp);
    });

    result["summary"] = Array.from(summaryTemp.values());
    result["top-10-unpaid-customers"] = top10UnpaidCustomer(customerTemp);
    result["summary-customer"] = aggregateCustomers(arData);
    result["summary-unpaid"] = getUnpaidInvoices(arData);

    return result;
  }

  async function getArOtherSummery(startDate, endDate) {
    const arOtherData = await _getArData("/AR TRADE OTHER 180", startDate, endDate) || [];
  }

  function summaryData(dt, summaryTemp) {
    const branch = String(dt["Branch"] || "Unknown");
    const group = String(dt["SalesGroup"] || "Unknown");
    const customer = dt["CustomerName"] || "Unknown";
    const key = customer + "|" + branch + "|" + group;

    if (!summaryTemp.has(key)) {
      summaryTemp.set(key, {
        branch,
        group,
        customer,
        "unpaid-invoice": 0,
        "overdue-amount": 0,
        "overdue-30-plus": 0,
        "overdue-90-plus": 0
      });
    }

    const result = summaryTemp.get(key);

    result["unpaid-invoice"] += parseFloat(dt["BalanceIDR"] || 0);
    result["overdue-amount"] += (
      parseFloat(dt["Current"] || 0) * dt["Rate"] +
      parseFloat(dt["_130"] || 0) * dt["Rate"]
    );
    result["overdue-30-plus"] += (
      parseFloat(dt["_3160"] || 0) * dt["Rate"] +
      parseFloat(dt["_6090"] || 0) * dt["Rate"]
    );
    result["overdue-90-plus"] += (
      parseFloat(dt["_90180"] || 0) * dt["Rate"] +
      parseFloat(dt["over180"] || 0) * dt["Rate"]
    );
  }

  // aggregate and group by are not supported in odata v3, so we need to do it at client
  function totalUnpaidCustomers(dt, temp) {
    const customerName = dt["CustomerName"];
    const branch = String(dt["Branch"] || "Unknown");
    const group = String(dt["SalesGroup"] || dt["Group"] || "Unknown");
    const key = customerName + "|" + branch + "|" + group;
    const amount = parseFloat(dt["BalanceIDR"]) || 0;

    if (temp.has(key)) {
      temp.get(key).amount += amount;
    } else {
      temp.set(key, { customer: customerName, branch, group, amount });
    }
  }

  function top10UnpaidCustomer(customerTemp) {
    return Array.from(customerTemp.values());
  }

  function aggregateCustomers(data) {
    const customerMap = new Map();

    data.forEach(dt => {
      const name = dt["CustomerName"] || "Unknown";
      const branch = String(dt["Branch"] || "Unknown");
      const group = String(dt["SalesGroup"] || "Unknown");
      const key = name + "|" + branch + "|" + group;
      const current = parseFloat((dt["Current"] * dt["Rate"]) || 0);
      const val1_30 = parseFloat((dt["_130"] * dt["Rate"]) || 0);
      const val31_60 = parseFloat((dt["_3160"] * dt["Rate"]) || 0);
      const val61_90 = parseFloat((dt["_6090"] * dt["Rate"]) || 0);
      const val91_180 = parseFloat((dt["_90180"] * dt["Rate"]) || 0);
      const val_over180 = parseFloat((dt["over180"] * dt["Rate"]) || 0);
      const balance = parseFloat(dt["BalanceIDR"] || 0);

      if (customerMap.has(key)) {
        const existing = customerMap.get(key);

        existing.current += current;
        existing["1-30"] += val1_30;
        existing["31-60"] += val31_60;
        existing["61-90"] += val61_90;
        existing["91-180"] += val91_180;
        existing["over180"] += val_over180;
        existing.amountDue += balance;
      } else {
        customerMap.set(key, {
          customer: name,
          branch: branch,
          group: group,
          current: current,
          "1-30": val1_30,
          "31-60": val31_60,
          "61-90": val61_90,
          "91-180": val91_180,
          "over180": val_over180,
          amountDue: balance
        });
      }
    });

    return Array.from(customerMap.values());
  }

  function getUnpaidInvoices(data) {
    return data.map(dt => ({
      customer: dt["CustomerName"] || "Unknown",
      branch: String(dt["Branch"] || "Unknown"),
      group: String(dt["SalesGroup"] || "Unknown"),
      number: dt["RefNbr"] || dt["DocumentNo"] || "",
      date: dt["Date"],
      dueDate: dt["DueDate"],
      amountDue: parseFloat(dt["BalanceIDR"] || 0)
    }));
  }

  function queryPaid(startDate = null, endDate = null, customer = null) {
    let ext = "";

    if (startDate && endDate) {
      ext += `and ap.AdjDate between '${startDate}' and '${endDate}'`;
    } else {
      ext += "and format(ap.AdjDate, 'yyyyMM') >= format(dateadd(month, -7, getdate()), 'yyyyMM')";
    }

    if (customer) {
      ext = `and aa.AdjdCustomerID = ${customer}`;
    }

    const query = `
      SELECT
          b.AcctName,
          aa.AdjdRefNbr,
          ap.AdjDate,
          b2.AcctName AS Branch,
          x.Description AS GroupCode,
          arr.OrigDocAmt
      FROM ARAdjust aa
      INNER JOIN ARInvoice ai ON ai.RefNbr = aa.AdjdRefNbr AND ai.CompanyID = aa.CompanyID
      CROSS APPLY
      (
          SELECT TOP 1
              s.SubCD,
              SUBSTRING(
                  s.[Description],
                  CHARINDEX(' ', s.[Description]),
                  CHARINDEX('-', s.[Description]) - CHARINDEX(' ', s.[Description])
              ) AS Description
          FROM ARTran art
          INNER JOIN Sub s ON s.SubID = art.SubID AND s.CompanyID = art.CompanyID
          WHERE art.RefNbr = ai.RefNbr AND art.CompanyID = 2
          ORDER BY s.SubCD DESC
      ) x
      INNER JOIN ARRegister arr ON arr.RefNbr = ai.RefNbr AND arr.CompanyID = ai.CompanyID
      INNER JOIN ARPayment ap ON ap.RefNbr = aa.AdjgRefNbr AND ap.CompanyID = aa.CompanyID
      INNER JOIN BAccount b ON b.BAccountID = aa.CustomerID AND b.CompanyID = aa.CompanyID
      INNER JOIN BAccount b2 ON b2.BAccountID = aa.AdjgBranchID
      WHERE aa.CompanyID = 2
          AND arr.Status = 'C'
          AND aa.AdjdDocType = 'INV'
          AND ap.DocType = 'PMT'
        ${ext}
    `;

    return query;
  }

  async function getPaidInvoicesSummary() {
    try {
      const rawQuery = queryPaid();
      const query = `
        select AcctName as customer, Branch as branch, GroupCode as groupCode, 
          sum(case when format(AdjDate, 'yyyyMM') = format(getdate(), 'yyyyMM') then OrigDocAmt else 0 end) as currentMonth, 
          sum(case when format(AdjDate, 'yyyyMM') >= format(dateadd(month, -1, getdate()), 'yyyyMM') then OrigDocAmt else 0 end) as lastMonth, 
          sum(OrigDocAmt) as last12Month
        from (${rawQuery}) as summary
        group by AcctName, Branch, GroupCode
      `;

      const pool = await connectDB();
      const request = await pool.request().query(query);

      return request.recordset.map(row => ({
        customer: row.customer || "Unknown",
        branch: String(row.branch || "Unknown"),
        group: String(row.groupCode || "Unknown"),
        currentMonth: parseFloat(row.currentMonth || 0),
        lastMonth: parseFloat(row.lastMonth || 0),
        last12Month: parseFloat(row.last12Month || 0)
      }));
    } catch (err) {
      return [];
    }
  }

  async function getPaidVsUnpaidMonthly() {
    const d = new Date();
    d.setMonth(d.getMonth() - 11);
    // because odata parameter take date instead of period, i set the minimum to the lowest day possible which is 01
    const minPeriod = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    const maxPeriod = new Date().toISOString().split('T')[0];

    try {
      const pool = await connectDB();
      const rawQuery = queryPaid(minPeriod, maxPeriod);

      const query = `
        select format(AdjDate, 'yyyyMM') as Period, Branch, 
          GroupCode, AcctName as Customer, sum(OrigDocAmt) as Amount
        from (${rawQuery}) as summary
        group by format(AdjDate, 'yyyyMM'), Branch, GroupCode, AcctName
      `;
      const request = await pool.request().query(query);
      const paidData = request.recordset;

      const monthlyMap = new Map();

      // Process Paid (from SQL)
      paidData.forEach(row => {
        const period = row.Period;
        const branch = String(row.Branch || "Unknown");
        const group = String(row.GroupCode || "Unknown");
        const customer = String(row.Customer || "Unknown");
        const key = period + "|" + branch + "|" + customer;

        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, { period, branch, group, customer, paid: 0, unpaid: 0 });
        }

        monthlyMap.get(key).paid += parseFloat(row.Amount || 0);
      });

      // Process Unpaid (from OData)
      const unpaidData = await getUnpaidData(minPeriod, maxPeriod);

      unpaidData.forEach(ud => {
        const dateObj = new Date(ud["Date"]);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const period = `${year}${month}`;
        const branch = String(ud["Branch"] || "Unknown");
        const group = String(ud["SalesGroup"] || ud["GroupCode"] || "Unknown");
        const customer = String(ud["CustomerName"] || "Unknown");
        const key = period + "|" + branch + "|" + customer;

        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, { period, branch, group, customer, paid: 0, unpaid: 0 });
        }

        monthlyMap.get(key).unpaid += parseFloat(ud["BalanceIDR"] || 0);
      });

      const finalMonthly = Array.from(monthlyMap.values());
      finalMonthly.sort((a, b) => a.period.localeCompare(b.period));

      return finalMonthly;
    } catch (err) {
      logger.error("getPaidVsUnpaidMonthly error: " + (err?.message || err));
      console.error("getPaidVsUnpaidMonthly error:", err?.message || err);
      return [];
    }
  }

  async function allInvoicesCustomers(startDate, endDate) {
    const query = `
      select b.AcctName as CustomerName, arr.RefNbr, arr.DocDate as Date, 
        arr.DueDate, arr.CuryID as Currency, sum(arr.CuryOrigDocAmt) as AmountInCurrency, 
        sum(arr.OrigDocAmt) as AmountInHomeCurrency, sum(arr.DocBal) as AmountDueInHomeCurrency
      from ARRegister as arr
      inner join ARInvoice as ai on arr.RefNbr = ai.RefNbr and arr.CompanyID = ai.CompanyID 
      inner join BAccount as b on arr.CustomerID = b.BAccountID
      where arr.CompanyID = 2 and arr.DocDate between '${startDate}' and '${endDate}'
      group by b.AcctName, arr.RefNbr, arr.DocDate, arr.DueDate, arr.CuryID
    `;

    try {
      const pool = await connectDB();
      const request = await pool.request().query(query);

      return request.recordset.map(row => ({
        customer: row.CustomerName || "Unknown",
        invoiceNo: row.RefNbr || "",
        date: row.Date || "",
        dueDate: row.DueDate || "",
        currency: row.Currency || "",
        amountInCurrency: parseFloat(row.AmountInCurrency || 0),
        amountInHomeCurrency: parseFloat(row.AmountInHomeCurrency || 0),
        amountDueInHomeCurrency: parseFloat(row.AmountDueInHomeCurrency || 0)
      }));
    } catch (err) {
      return [];
    }
  }

  async function allUmcThisMonth() {
    let query = `
      select b.AcctName as Customer, 
        ttapr.RefNbr, 
        CuryTaxableAmount as AmountInCurrency, 
        TaxableAmount as AmountInHomeCurrency, 
        dateadd(day, 7, ttapr.DocDate) as DocDate, 
        ttapr.CuryID
      from ttARPrepaymentReq as ttapr
      inner join BAccount as b on ttapr.CustomerID = b.BAccountID and ttapr.CompanyID = b.CompanyID
      where format(dateadd(day, 7, ttapr.DocDate), 'yyyyMM') = format(getdate(), 'yyyyMM')
        and ttapr.CompanyID = 2
        and ttapr.Status in (2) -- balanced 
    `;

    try {
      const pool = await connectDB();
      const request = await pool.request().query(query);

      return request.recordset.map(row => ({
        customer: row.Customer || "Unknown",
        invoiceNo: row.RefNbr || "",
        docDate: row.DocDate || "",
        currency: row.CuryID || "",
        amountInCurrency: parseFloat(row.AmountInCurrency || 0),
        amountInHomeCurrency: parseFloat(row.AmountInHomeCurrency || 0),
      }));
    } catch (err) {
      return [];
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

module.exports = accountReceivableService; 
