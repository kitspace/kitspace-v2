import Joi from 'joi'

const SearchFormModel = Joi.object({
  _csrf: Joi.string(),
  query: Joi.string().required().max(60),
})

export default SearchFormModel
