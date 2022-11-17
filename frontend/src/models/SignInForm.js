import Joi from 'joi'

const SignInFormModel = Joi.object({
  _csrf: Joi.string(),
  username: Joi.alternatives()
    .try(
      Joi.string()
        .regex(/^[a-zA-Z0-9_.-]+$/, 'username')
        .min(2)
        .max(40)
        .messages({
          'string.pattern.name':
            'Invalid "username". Username must contain only letters, numbers, "_", "-", and "."',
        }),

      Joi.string()
        .regex(/^([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4})$/i, 'email')
        .messages({
          'string.pattern.name': 'Invalid email address',
        }),
    )
    .required(),
  password: Joi.string().required(),
})

export default SignInFormModel
// regex to match email
