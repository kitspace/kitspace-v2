import Joi from 'joi'

export const SignInForm = Joi.object({
  username: Joi.string().alphanum().required(),
  password: Joi.string().required(),
})
