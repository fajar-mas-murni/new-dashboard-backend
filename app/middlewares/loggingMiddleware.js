const expressWinston = require("express-winston");
const generalLogger = require("../configs/loggerConfig.js");

function loggingMiddleware() {
    const config = expressWinston.logger({
        winstonInstance: generalLogger(),
        meta: true,
        msg: "HTTP {{req.method}} {{req.url}}",
        level: (_, res) => {
            if (res.statusCode >= 500) {
                return "error";
            } else if (res.statusCode >= 400) {
                return "warn";
            } else if (res.statusCode >= 100) {
                return "info";
            }

            return "debug";
        },
        dynamicMeta: (_, res) => {
            const meta = {
                res: {
                    statusCode: res.statusCode,
                    message: res.statusMessage || "No message provided"
                }
            };
            
            return meta;
        },
    });

    return config;
}

module.exports = loggingMiddleware;