import Joi from 'joi'

const SignUpFormModel = Joi.object({
  _csrf: Joi.string(),
  username: Joi.string().alphanum().required().max(20),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string().min(6).required(),
})

export default SignUpFormModel
