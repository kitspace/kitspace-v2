import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Form, Icon, Input } from 'semantic-ui-react'
import { useDebounceCallback } from 'usehooks-ts'

import { useSearchQuery } from '@contexts/SearchContext'
import UseForm from '@hooks/useForm'
import SearchFormModel from '@models/SearchFrom'

import styles from './SearchInput.module.scss'

const SearchInput = ({ className, isInstant }: SearchInputProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const { form, onChange, formatErrorPrompt, populate } = UseForm(SearchFormModel)
  const { push } = useRouter()
  const { updateQuery, query } = useSearchQuery()

  useEffect(() => {
    populate({ query: query })
  }, [populate, query])

  /**
   * i.   Update the search query in the {@link SearchProvider}.
   * ii.  Change the search query parameter `q`.
   * iii. Make a `shallow` redirect to the new url `/search?q=${submitted query term}`.
   ** note: the `shallow option only work if the path name doesn't change,
   ** e.g., submitting a search from the `/search` path will be shallow,
   ** from other paths it will actually redirect to `/search` which is the desired behavior.
   ** see https://nextjs.org/docs/routing/shallow-routing#caveats.
   */
  const handleSubmit = value => {
    setIsLoading(true)
    updateQuery(value)

    push(`/search?q=${encodeURIComponent(value)}`, undefined, {
      shallow: true,
    }).then(() =>
      // When redirection finishes, replace the loading icon with the search one.
      setIsLoading(false),
    )
  }

  const debouncedSubmit = useDebounceCallback((event) => handleSubmit(event.target.value), 300)

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
        id="search-field"
        name="query"
        placeholder="Search for projects"
        value={form.query ?? ''}
        onChange={handleChange}
        icon={
          isInstant ? (
            <SearchIcon />
          ) : (
            {
              name: 'search',
              circular: true,
              link: true,
              onClick: () => handleSubmit(form.query),
            }
          )
        }
      />
    </Form>
  )
}

const LoadingIcon = () => (
  <Icon loading className={styles.searchFieldIcon} name="spinner" />
)
const SearchIcon = () => <Icon className={styles.searchFieldIcon} name="search" />

export default SearchInput

interface SearchInputProps {
  className?: string
  isInstant?: boolean
}
