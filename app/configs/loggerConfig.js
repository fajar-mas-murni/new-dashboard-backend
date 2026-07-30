const { createLogger, transports, format } = require("winston");
const { formatDate } = require("../helpers/fmmHelpers.js");

const currentDate = formatDate(new Date(), "");
const pathLogs = "./logs";

function generalLogger() {
    return createLogger({
        transports: [
            new transports.File({
                filename: `${pathLogs}/general/log${currentDate}.log`
            })
        ],
        format: format.combine(
            format.json(),
            format.timestamp(),
            format.prettyPrint()
        ),
        statusLevels: true
    });
}

module.exports = generalLogger;