export function validateBody(schema) {
    return (req, _res, next) => {
        req.body = schema.parse(req.body);
        next();
    };
}
export function validateQuery(schema) {
    return (req, _res, next) => {
        const parsed = schema.parse(req.query);
        req.query = parsed;
        next();
    };
}
