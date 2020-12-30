import Joi from 'joi'

export const ExistingProjectFrom = Joi.object({
  _csrf: Joi.string(),
  name: Joi.string().required().max(60),
})
