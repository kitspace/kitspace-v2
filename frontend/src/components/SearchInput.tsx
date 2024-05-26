import { useEffect, useRef, useState } from 'react'
import { Icon, Input } from 'semantic-ui-react'

import { useSearchQuery } from '@contexts/SearchContext'
import debounce from 'lodash.debounce'

import styles from './SearchInput.module.scss'
import { useRouter } from 'next/router'

const SearchInput = () => {
  const {
    replace,
    query: { q: routerQuery },
  } = useRouter()
  const { updateQuery: updateContextQuery, query: contextQuery } = useSearchQuery()
  const [inputQuery, setInputQuery] = useState(contextQuery)

  useEffect(() => {
    if (routerQuery !== inputQuery) {
      setInputQuery(routerQuery as string)
      updateContextQuery(routerQuery as string)
    }
    // We don't want to depend on `inputQuery` because it would be locked to the
    // `routerQuery`. We just want to update `inputQuery` when `routerQuery`
    // changes because of navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerQuery])

  const debouncedSubmit = useRef(debounce(value => updateContextQuery(value), 100))
  const debouncedUpdateUrl = useRef(
    debounce(value => {
      const path = value ? `/search?q=${encodeURIComponent(value)}` : '/'
      replace(path, undefined, { shallow: true })
    }, 1000),
  )

  const handleChange = (value: string) => {
    debouncedSubmit.current.cancel()
    debouncedUpdateUrl.current.cancel()
    setInputQuery(value)
    debouncedSubmit.current(value)
    debouncedUpdateUrl.current(value)
  }

  return (
    <Input
      fluid
      autoComplete="off"
      className={styles.searchInput}
      data-cy="search-field"
      icon={
        inputQuery ? (
          <Icon
            link
            className={styles.searchIcon}
            name="delete"
            onClick={() => {
              handleChange('')
            }}
          />
        ) : (
          <Icon className={styles.searchIcon} name="search" />
        )
      }
      id="search-field"
      name="query"
      placeholder="Search for projects"
      value={inputQuery}
      onChange={e => handleChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.target.blur()
        }
      }}
    />
  )
}

export default SearchInput
