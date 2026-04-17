import Joi from "joi";

export const registerUserSchema = Joi.object({
    username: Joi.string().alphanum().min(3).lowercase().trim().required(),
    email: Joi.string().email().lowercase().trim().required(),
    fullName: Joi.string().min(2).trim().required(),
    password: Joi.string().min(8).required(),
});

export { registerUserSchema };