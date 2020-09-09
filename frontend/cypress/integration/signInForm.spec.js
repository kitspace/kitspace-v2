import faker from 'faker'

import { SignInForm } from '../../models/SignInForm'

describe('Log in form validation', () => {
  before(() => cy.visit('/login'))

  afterEach(() => cy.get('button').contains('Login').should('be.disabled'))

  it('has the proper fields', () => {
    const formFields = SignInForm.schema().$_terms.keys.map(field => field.key)

    formFields.forEach(field => cy.get(`input[name=${field}]`))
  })

  it('validates username field', () => {
    const invalidUsernames = ['abc ', 'abc@', ' ', '^', 'ZqFe3jOudI7DuBOJ1wyXT']

    invalidUsernames.forEach(username => {
      cy.get('input[name=username]').clear().type(username)
      cy.get('.negative').as('message')

      cy.get('@message').should('be.visible')
      cy.get('@message').get('div.header').should('not.be.visible')
      cy.get('@message').should('include.text', '"username"')
    })
  })
})

describe('Log in from submission', () => {
  before(() => cy.clearCookies())

  it('validates the last login for a user', () => {
    /* TODO: the way `superagent` submit `xhr` request isn't compatible with `Cypress
     so pressing the button directly don't work for now.
     To test API errors which is tested by gitea itself, we can mock or find a solution for `superagent`
   */
  })
})
