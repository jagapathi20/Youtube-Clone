import { ApiError } from "../utils/ApiError.js"
const errorHandler = (err, req, res, next) => {
   let { statusCode, message } = err;

    if (req.files) {
        Object.values(req.files).flat().forEach(f => cleanupLocalFiles(f.path))
    }
    if (req.file) {
        cleanupLocalFiles(req.file.path)
    }
    
    if (!(err instanceof ApiError)) {
        statusCode = err.statusCode || 500;
        message = err.message || "Internal Server Error";
    }

    console.error(`[Error] ${req.method} ${req.path} - ${message}`);

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && {stack: err.stack})
    })
}

export {errorHandler}