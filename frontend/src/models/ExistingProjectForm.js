import Joi from 'joi'

export const ExistingProjectFromModel = Joi.object({
  _csrf: Joi.string(),
  name: Joi.string().required().max(60),
})
