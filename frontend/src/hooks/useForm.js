import { useState, useContext, useCallback, useEffect } from 'react'
import { AuthContext } from '@contexts/AuthContext'

/**
 *
 * @param {object} schema
 * @param {boolean=} validateOnBlur
 */
export default function UseForm(schema, validateOnBlur) {
  const { csrf } = useContext(AuthContext)
  const [form, setForm] = useState({})
  const [formValidationErrors, setFormValidationErrors] = useState([])
  /*
  For forms supporting lazy validation (onBlur),
  a dirty field is a field the user has interacted with on blurred it (moved focus to other element).
  */
  const [dirtyFields, setDirtyFields] = useState([])

  useEffect(() => setFormValidationErrors(validate(form, schema)), [form, schema])

  const onChange = (event, data) => {
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

  /**
   * Mark a field `dirty`.
   * @param {Event} event
   */
  const onBlur = event => {
    if (validateOnBlur) {
      setDirtyFields(prevFields => [...prevFields, event.target.name])
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

  const isValid = Object.keys(formValidationErrors).length === 0

  const isErrorField = field => {
    const fieldHasInvalidValue =
      formValidationErrors?.[field] && form[field] != null

    if (validateOnBlur) {
      return fieldHasInvalidValue && dirtyFields.includes(field)
    }

    return fieldHasInvalidValue
  }

  const formatErrorPrompt = field => {
    if (isErrorField(field)) {
      // The structure for react-semantic-ui error object,
      // see https://react.semantic-ui.com/collections/form/#shorthand-field-control-id
      return { content: formValidationErrors[field], pointing: 'below' }
    }
  }

  return {
    form,
    onChange,
    populate,
    isValid,
    errors: formValidationErrors,
    formatErrorPrompt,
    onBlur,
    clear: () => setForm({}),
  }
}

/**
 *
 * @param {*} form
 * @param {*} schema
 * @returns all the errors in a form eagerly.
 */
const validate = (form, schema) => {
  const { error } = schema.validate({ ...form }, { abortEarly: false })
  const details = error?.details ?? []

  const allErrors = {}
  for (const errorField of details) {
    allErrors[errorField.context.key] = errorField.message
  }

  return allErrors
}
