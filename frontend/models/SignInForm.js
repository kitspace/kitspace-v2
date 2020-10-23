import Joi from 'joi'

export const SignInForm = Joi.object({
  _csrf: Joi.string(),
  username: Joi.string().alphanum().required().max(20),
  password: Joi.string().required(),
  remember: Joi.boolean(),
})
