import Joi from 'joi'

const SyncRepoFromModel = Joi.object({
  _csrf: Joi.string(),
  url: Joi.string().uri(),
})

export default SyncRepoFromModel
