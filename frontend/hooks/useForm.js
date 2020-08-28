import React, { useState } from 'react'

export default function (schema) {
  const [form, setForm] = useState({})

  const onChange = e => {
    e.persist()
    setForm(form => ({ ...form, [e.target.name]: e.target.value }))
  }
  const { error } = schema.validate({ ...form })
  const isValid = error === undefined

  const errorDetails = error?.details[0]
  const errors = !isValid
    ? { field: errorDetails.context.key, msg: errorDetails.message }
    : {}

  return [form, onChange, isValid, errors]
}
