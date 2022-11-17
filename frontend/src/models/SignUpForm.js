import Joi from 'joi'

const SignUpFormModel = Joi.object({
  _csrf: Joi.string(),
  username: Joi.string()
    .regex(/^[a-zA-Z0-9_.-]+$/, 'username')
    .min(2)
    .max(40)
    .messages({
      'string.pattern.name':
        'Invalid "username". Username must contain only letters, numbers, "_", "-", and ".".',
    }),
  email: Joi.string()
    .regex(/^([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4})$/i, 'email')
    .messages({
      'string.pattern.name': 'Invalid email address',
    })
    .required(),
  password: Joi.string().min(6).required(),
})

export default SignUpFormModel
