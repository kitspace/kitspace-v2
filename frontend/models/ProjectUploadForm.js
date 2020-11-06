import Joi from 'joi'

export const ProjectUploadForm = Joi.object({
  _csrf: Joi.string(),
  name: Joi.string().alphanum().required(),
  link: Joi.string(),
})
