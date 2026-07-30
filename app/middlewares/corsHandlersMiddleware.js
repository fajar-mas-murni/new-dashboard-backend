const cors = require("cors");

function corsHandlerMiddleware() {
    const originSetup = {
        origin: process.env.CORS,
        optionsSuccessStatus: 200,
        credentials: true
    };
    const callCors = cors(originSetup);

    return callCors;
}

module.exports = corsHandlerMiddleware;