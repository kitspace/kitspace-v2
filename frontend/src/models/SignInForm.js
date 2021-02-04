import Joi from 'joi'

export const SignInFormModel = Joi.object({
  _csrf: Joi.string(),
  username: Joi.string()
    .regex(/^(?:[A-Z\d][A-Z\d_-]{0,19}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4})$/i)
    .messages({
      'string.pattern.base': 'Invalid username or email',
    }),
  password: Joi.string().required(),
  remember: Joi.boolean(),
})
