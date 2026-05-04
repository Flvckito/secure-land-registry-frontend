import { useState, useCallback, useRef } from 'react'

/**
 * useApi — wraps an async service call with loading, error, and data state.
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(landService.getAll)
 *   useEffect(() => { execute({ page: 1 }) }, [execute])
 */
export function useApi(asyncFn) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Track if component is still mounted to avoid setState on unmount
  const mounted = useRef(true)

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      try {
        const result = await asyncFn(...args)
        if (mounted.current) setData(result)
        return result
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'An error occurred'
        if (mounted.current) setError(message)
        throw err
      } finally {
        if (mounted.current) setLoading(false)
      }
    },
    [asyncFn]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, execute, reset }
}

/**
 * useForm — controlled form state with validation support.
 *
 * Usage:
 *   const { values, errors, handleChange, handleSubmit, setError } = useForm(
 *     { email: '', password: '' },
 *     (values) => { ... submit logic ... }
 *   )
 */
export function useForm(initialValues, onSubmit, validate) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    // Clear error on change
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }, [])

  const setFieldError = useCallback((field, message) => {
    setErrors((prev) => ({ ...prev, [field]: message }))
  }, [])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      if (validate) {
        const validationErrors = validate(values)
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors)
          return
        }
      }
      setSubmitting(true)
      try {
        await onSubmit(values)
      } finally {
        setSubmitting(false)
      }
    },
    [values, validate, onSubmit]
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
  }, [initialValues])

  return {
    values,
    errors,
    submitting,
    handleChange,
    handleSubmit,
    setFieldError,
    setValues,
    reset,
  }
}