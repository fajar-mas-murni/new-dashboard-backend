function nullChangerMiddleware(req, _res, next) {
    const body = req.body;

    if (req.body) {
        for (const key in body) {
            if (body[key] === "") {
                body[key] = null;
            }
        }
    }

    return next();
}

module.exports = nullChangerMiddleware;
