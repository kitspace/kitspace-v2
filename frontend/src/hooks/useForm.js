import React, { useState, useContext } from 'react'
import { AuthContext } from '@contexts/AuthContext'

export default function (schema) {
  const [form, setForm] = useState({})
  const { csrf } = useContext(AuthContext)

  const onChange = e => {
    e.persist()
    setForm(form => ({
      _csrf: csrf,
      ...form,
      [e.target.name]:
        e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))
  }

  const populate = (data, predicate) => {
    if (predicate) {
      setForm({ _csrf: csrf, ...data })
    }
  }

  const { error } = schema.validate({ ...form })
  const isValid = error == null

  const errorDetails = error?.details[0]
  const errors = !isValid
    ? { field: errorDetails.context.key, msg: errorDetails.message }
    : {}

  const isErrorField = field => errors.field === field && form[field] != null

  const formatErrorPrompt = field => {
    return isErrorField(field) ? { content: errors.msg, pointing: 'below' } : null
  }

  return { form, onChange, populate, isValid, errors, formatErrorPrompt }
}
