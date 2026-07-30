function payloadValidationMiddleware(req, _res, next) {
    const hasPayload = Object.keys(req.body).length > 0 ||
        Object.keys(req.query).length > 0 ||
        Object.keys(req.params).length > 0;

    if (hasPayload) {
        return next();
    }

    const error = new Error('Payload is missing');
    error.status = 400;

    return next(error);
}

module.exports = payloadValidationMiddleware;
