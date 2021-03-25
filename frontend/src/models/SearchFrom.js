import Joi from 'joi'

export const SearchFromModel = Joi.object({
    _csrf: Joi.string(),
    query: Joi.string().required().max(60),
})
