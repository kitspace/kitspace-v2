import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Form, Input } from 'semantic-ui-react'

import { useSearchQuery } from '@contexts/SearchContext'
import UseForm from '@hooks/useForm'
import SearchFormModel from '@models/SearchFrom'

const SearchBar = () => {
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
  const onSubmit = () => {
    updateQuery(form.query)
    push(`/search?q=${form.query}`, undefined, { shallow: true })
  }

  return (
    <Form onSubmit={onSubmit}>
      <Form.Field
        data-cy="search-field"
        icon="search"
        fluid
        control={Input}
        placeholder="Search for projects"
        name="query"
        value={form.query ?? ''}
        onChange={onChange}
        error={form.query !== '' && formatErrorPrompt('query')}
      />
    </Form>
  )
}

export default SearchBar
