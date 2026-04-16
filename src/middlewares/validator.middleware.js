import { ApiError } from "../utils/ApiError";

const validate = (schema) => (req, res, next) => {
    const {error} = schema.validate(req.body, {aboutEarly: false})
    if (error){
        const message = error.details.map((d) => d.message).join(", ")
        throw new ApiError(400, message)
    }
    next()
}

export {validate}