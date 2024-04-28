import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { Form, Icon, Input } from 'semantic-ui-react'

import { useSearchQuery } from '@contexts/SearchContext'

const NavSearchInput = () => {
  const { push } = useRouter()
  const { query: contextQuery, updateQuery: updateContextQuery } = useSearchQuery()
  const [query, setQuery] = useState(contextQuery)

  const handleSubmit = () => {
    updateContextQuery(query)
    const path = `/search?q=${encodeURIComponent(query)}`
    push(path)
  }

  return (
    <Form data-cy="search-form" onSubmit={handleSubmit}>
      <Form.Field
        fluid
        autoComplete="off"
        control={Input}
        data-cy="search-field"
        icon={
          <Icon
            circular
            disabled={!query}
            link={!!query}
            name="search"
            onClick={handleSubmit}
          />
        }
        id="search-field"
        name="query"
        placeholder="Search for projects"
        value={query ?? ''}
        onChange={e => setQuery(e.target.value)}
      />
    </Form>
  )
}

export default NavSearchInput
