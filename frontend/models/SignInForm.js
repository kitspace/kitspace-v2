import Joi from 'joi'

export const SignUpForm = Joi.object({
  username: Joi.string().alphanum().required(),
  password: Joi.string()
    .pattern(new RegExp('^[a-zA-Z0-9!@#%^&*()_]'))
    .min(6)
    .required(),
})
