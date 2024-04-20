import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Icon, Input } from 'semantic-ui-react'
import { useDebounceCallback } from 'usehooks-ts'

import { useSearchQuery } from '@contexts/SearchContext'

import styles from './SearchInput.module.scss'

const SearchInput = () => {
  const { replace, query: routerQuery } = useRouter()
  const { updateQuery: updateContextQuery } = useSearchQuery()

  const [query, setQuery] = useState(routerQuery.q)

  const handleSubmit = value => {
    updateContextQuery(value)
    const path = value ? `/search?q=${encodeURIComponent(value)}` : '/'
    replace(path, undefined, { shallow: true })
  }

  useEffect(() => {
    if (Array.isArray(routerQuery.q)) {
      throw new Error(`Unexpected query: ${routerQuery.q}`)
    }
    setQuery(routerQuery.q)
    updateContextQuery(routerQuery.q)
  }, [routerQuery.q, updateContextQuery])

  const debouncedSubmit = useDebounceCallback(
    event => handleSubmit(event.target.value),
    300,
  )

  const handleChange = event => {
    setQuery(event.target.value)
    debouncedSubmit.cancel()
    debouncedSubmit(event)
  }

  return (
    <Input
      fluid
      autoComplete="off"
      className={styles.searchInput}
      data-cy="search-field"
      icon={
        query ? (
          <Icon
            link
            className={styles.searchIcon}
            name="delete"
            onClick={() => {
              setQuery('')
              handleSubmit('')
            }}
          />
        ) : (
          <Icon className={styles.searchIcon} name="search" />
        )
      }
      id="search-field"
      name="query"
      placeholder="Search for projects"
      value={query ?? ''}
      onChange={handleChange}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.target.blur()
        }
      }}
    />
  )
}

export default SearchInput
