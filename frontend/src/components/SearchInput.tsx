import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Form, Icon, Input } from 'semantic-ui-react'
import { useDebounceCallback } from 'usehooks-ts'

import { useSearchQuery } from '@contexts/SearchContext'
import UseForm from '@hooks/useForm'
import SearchFormModel from '@models/SearchFrom'

import styles from './SearchInput.module.scss'

const SearchInput = () => {
  const { form, onChange, formatErrorPrompt, populate } = UseForm(SearchFormModel)
  const { replace } = useRouter()
  const { updateQuery, query } = useSearchQuery()

  useEffect(() => {
    populate({ query: query })
  }, [populate, query])

  const handleSubmit = value => {
    updateQuery(value)
    const path = value ? `/search?q=${encodeURIComponent(value)}` : '/'
    replace(path)
  }

  const debouncedSubmit = useDebounceCallback(
    event => handleSubmit(event.target.value),
    300,
  )

  const handleChange = (event, target) => {
    onChange(event, target)
    debouncedSubmit.cancel()
    debouncedSubmit(event)
  }

  return (
    <Form data-cy="search-form" onSubmit={e => handleSubmit(e.target[0].value)}>
      <Form.Field
        fluid
        autoComplete="off"
        className={styles.searchInput}
        control={Input}
        data-cy="search-field"
        error={form.query !== '' && formatErrorPrompt('query')}
        icon={
          form.query ? (
            <Icon
              link
              className={styles.searchIcon}
              name="close"
              onClick={() => handleSubmit('')}
            />
          ) : (
            <Icon className={styles.searchIcon} name="search" />
          )
        }
        id="search-field"
        name="query"
        placeholder="Search for projects"
        value={form.query ?? ''}
        onChange={handleChange}
      />
    </Form>
  )
}

export default SearchInput
