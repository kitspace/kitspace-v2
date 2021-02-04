import Joi from 'joi'

export const SyncRepoFromModel = Joi.object({
  _csrf: Joi.string(),
  url: Joi.string().uri(),
})
