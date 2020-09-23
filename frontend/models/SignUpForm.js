import Joi from 'joi'

export const SignUpForm = Joi.object({
  username: Joi.string().alphanum().required().max(20),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string().min(6).required(),
})
