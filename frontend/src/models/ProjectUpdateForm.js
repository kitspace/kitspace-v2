import Joi from 'joi'

export const ProjectUpdateForm = Joi.object({
  _csrf: Joi.string(),
  name: Joi.string().required().max(60),
  description: Joi.string().allow('', null).max(300),
})
