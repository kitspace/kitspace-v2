import Joi from 'joi'

const ExistingProjectFromModel = Joi.object({
  _csrf: Joi.string(),
  name: Joi.string().required().max(60),
})

export default ExistingProjectFromModel
