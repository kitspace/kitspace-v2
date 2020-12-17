import Joi from 'joi'

export const SyncRepoFrom = Joi.object({
  _csrf: Joi.string(),
  url: Joi.string().uri(),
})
