import Joi from 'joi'

export const SignInForm = Joi.object({
  username: Joi.string().alphanum().required().max(20),
  password: Joi.string().required(),
  remember: Joi.boolean(),
})
