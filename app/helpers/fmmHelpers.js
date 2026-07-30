const fs = require("fs");
const Excel = require("exceljs");

function formatDate(date, separator = '') {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join(separator);
}

function createFilename(prefix, unique, ext) {
    const encode = btoa(unique);
    const filename = `${prefix}-${encode}.${ext}`;

    return filename;
}

async function saveFile(folder, filename, bufferCallback) {
    const path = `./uploads/${folder}/${filename}`;

    if (!fs.existsSync(path)) {
        try {
            const buffer = await bufferCallback();

            await fs.promises.appendFile(path, Buffer.from(buffer));
        } catch (error) {
            return null;
        }
    } 

    return filename;
}

/*
    parameters ->

    setup = {
        filename: "test",
        worksheets: [
            {
                worksheetName: "abc",
                headers: [
                    { header: "Name", key: 1, width: 10 },
                    { header: "Age", key: 2, width: 10 }
                ],
                bodies: [
                    { Name: "Syafiq", Age: 21 },
                    { Name: "Mas Wawan", Age: 33 }
                ],
                footers: ?
            }
        ]
    }
*/
function createWorkbook(setup) {
    const workbook = new Excel.Workbook();

    setup.worksheets.forEach(ws => {
        const worksheet = workbook.addWorksheet(ws.worksheetName);

        worksheet.columns = ws.headers;

        ws.bodies.forEach(row => {
            worksheet.addRow(row);
        });
    });

    return workbook;
}

function bigIntSafeJson(result) {
  return JSON.stringify(result, (_, value) =>
    typeof value === "bigint" ? parseInt(value) : value
  );
}

module.exports = { formatDate, createFilename, saveFile, createWorkbook, bigIntSafeJson };
