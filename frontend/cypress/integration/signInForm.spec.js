import faker from 'faker'

import { getFakeUsername } from '../support/getFakeUsername'
import SignInFormModel from '../../src/models/SignInForm'

describe('Log in form validation', () => {
  before(() => {
    cy.visit('/login')
    cy.get('[data-cy=login-grid] a').contains('Login').click({ force: true })
  })

  it('should have the proper fields', () => {
    // The form contains all the fields from the `SingInForm` model.
    cy.hasProperFields(SignInFormModel)
  })

  it('should validate username field', () => {
    const invalidUsernames = ['abc ', 'abc@', ' ', '^', 'ZqFe3jOudI7DuBOJ1wyXT']

    // Type the password to make sure we're validating the username only
    cy.get('input[name=password]').type('123456')

    invalidUsernames.forEach(username => {
      cy.get('input[name=username]').clear().type(username).blur()
      cy.get('.prompt.label').as('message')

      // Validation error message should appear.
      cy.get('@message').should('be.visible')

      // The error message should indicate that the username is invalid.
      cy.get('@message').should('include.text', 'Invalid username or email')

      // Login button should stay disabled
      cy.get('button').contains('Login').should('be.disabled')
    })
  })
})

describe('Log in form submission', () => {
  const username = getFakeUsername()
  const email = faker.unique(faker.internet.email)
  const password = '123456'

  before(() => {
    // create user and log him in.
    cy.createUser(username, email, password)
    cy.clearCookies()
    cy.visit('/login')
    cy.get('[data-cy=login-grid] a').contains('Login').click({ force: true })
  })

  it('should display error message on submitting form with wrong username', () => {
    cy.signIn('nonRegUser', password)
    cy.get('.negative').should('include.text', 'Wrong username or password')
  })

  it('should display error message on submitting form with wrong password', () => {
    cy.signIn(username, 'wrong_password_1234')
    cy.get('.negative').should('include.text', 'Wrong username or password')
  })
})
