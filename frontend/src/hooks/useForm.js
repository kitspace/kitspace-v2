import { useState, useContext, useCallback } from 'react'
import { AuthContext } from '@contexts/AuthContext'

export default function UseForm(schema) {
  const [form, setForm] = useState({})
  const { csrf } = useContext(AuthContext)

  const onChange = e => {
    e.persist()
    setForm(prevForm => ({
      _csrf: csrf,
      ...prevForm,
      [e.target.name]:
        e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))
  }

  /**
   * populate form data externally.
   * @param {object} data form data
   * @param {boolean} predicate condition to use for populating
   */
  const populate = useCallback(
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
