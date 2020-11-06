import Joi from 'joi'

export const ProjectUploadForm = Joi.object({
  _csrf: Joi.string(),
  name: Joi.string().alphanum().required().max(60),
  description: Joi.string().required().max(300),
  link: Joi.string(),
})
