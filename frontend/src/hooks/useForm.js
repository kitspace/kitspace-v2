import { useState, useContext, useCallback } from 'react'
import { AuthContext } from '@contexts/AuthContext'

export default function UseForm(schema) {
  const [form, setForm] = useState({})
  const { csrf } = useContext(AuthContext)

  const onChange = (event, data) => {
    event.persist()

    const isCheckBox = data?.type === 'checkbox'

    if (isCheckBox) {
      setForm(prevForm => ({
        _csrf: csrf,
        ...prevForm,
        [data.name]: data.checked,
      }))
    } else {
      setForm(prevForm => ({
        _csrf: csrf,
        ...prevForm,
        [event.target.name]: event.target.value,
      }))
    }
  }

  const populate = useCallback(
    /**
     * populate form data externally.
     * @param {object} data form data
     * @param {boolean} predicate condition to use for populating
     */
    (data, predicate = true) => {
      if (predicate) {
        setForm({ _csrf: csrf, ...data })
      }
    },
    [csrf],
  )

  const { error } = schema.validate({ ...form })
  const isValid = error == null

  const errorDetails = error?.details[0]
  const errors = !isValid
    ? { field: errorDetails.context.key, msg: errorDetails.message }
    : {}

  const isErrorField = field => errors.field === field && form[field] != null

  const formatErrorPrompt = field =>
    isErrorField(field) ? { content: errors.msg, pointing: 'below' } : null

  return { form, onChange, populate, isValid, errors, formatErrorPrompt }
}
