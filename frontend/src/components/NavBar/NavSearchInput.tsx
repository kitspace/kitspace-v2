import React from 'react'
import { useRouter } from 'next/router'
import { Form, Icon, Input } from 'semantic-ui-react'

import { useSearchQuery } from '@contexts/SearchContext'
import UseForm from '@hooks/useForm'
import SearchFormModel from '@models/SearchFrom'

const NavSearchInput = () => {
  const { form, onChange, formatErrorPrompt } = UseForm(SearchFormModel)
  const { push } = useRouter()
  const { updateQuery } = useSearchQuery()

  const handleSubmit = value => {
    updateQuery(value)
    const path = `/search?q=${encodeURIComponent(value)}`
    push(path)
  }

  return (
    <Form data-cy="search-form" onSubmit={e => handleSubmit(e.target[0]?.value)}>
      <Form.Field
        fluid
        autoComplete="off"
        control={Input}
        data-cy="search-field"
        error={form.query !== '' && formatErrorPrompt('query')}
        icon={
          <Icon
            circular
            disabled={!form.query}
            link={!!form.query}
            name="search"
            onClick={() => handleSubmit(form.query)}
          />
        }
        id="search-field"
        name="query"
        placeholder="Search for projects"
        value={form.query ?? ''}
        onChange={onChange}
      />
    </Form>
  )
}

export default NavSearchInput
