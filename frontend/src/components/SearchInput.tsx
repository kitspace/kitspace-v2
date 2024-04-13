import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Form, Icon, Input } from 'semantic-ui-react'
import { useDebounceCallback } from 'usehooks-ts'

import { useSearchQuery } from '@contexts/SearchContext'
import UseForm from '@hooks/useForm'
import SearchFormModel from '@models/SearchFrom'

import styles from './SearchInput.module.scss'

const SearchInput = ({ className, isInstant }: SearchInputProps) => {
  const { form, onChange, formatErrorPrompt, populate } = UseForm(SearchFormModel)
  const { push, replace } = useRouter()
  const { updateQuery, query } = useSearchQuery()

  useEffect(() => {
    populate({ query: query })
  }, [populate, query])

  const handleSubmit = value => {
    updateQuery(value)

    const path = value ? `/search?q=${encodeURIComponent(value)}` : '/'

    if (isInstant) {
      replace(path)
    } else {
      push(path)
    }
  }

  const debouncedSubmit = useDebounceCallback(
    event => handleSubmit(event.target.value),
    300,
  )

  const handleChange = (event, ...args) => {
    onChange(event, ...args)
    if (isInstant !== undefined) {
      debouncedSubmit.cancel()
      debouncedSubmit(event)
    }
  }

  return (
    <Form data-cy="search-form" onSubmit={e => handleSubmit(e.target[0].value)}>
      <Form.Field
        fluid
        autoComplete="off"
        className={className}
        control={Input}
        data-cy="search-field"
        error={form.query !== '' && formatErrorPrompt('query')}
        icon={
          isInstant ? (
            form.query ? (
              {
                style: { marginRight: 7 },
                name: 'close',
                link: true,
                onClick: () => handleSubmit(''),
              }
            ) : (
              <Icon className={styles.searchFieldIcon} name="search" />
            )
          ) : (
            {
              name: 'search',
              circular: true,
              link: true,
              onClick: () => handleSubmit(form.query),
            }
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

interface SearchInputProps {
  className?: string
  isInstant?: boolean
}
