export const sendSuccess = (res, data, meta = {}, status = 200) => {
    res.status(status).json({
        success: true,
        data,
        meta,
        error: null
    });
};
export const asyncHandler = (handler) => (req, res, next) => {
    handler(req, res, next).catch(next);
};
