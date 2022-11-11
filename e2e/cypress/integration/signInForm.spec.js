import faker from 'faker'

import { getFakeUser } from '../support/getFakeUser'

describe('Log in form validation', () => {
  before(() => {
    cy.visit('/login')
    cy.get('[data-cy=login-grid] a').contains('Login').click({ force: true })
  })
  it('should validate username field', () => {
    const invalidUsernames = ['abc ', 'abc@', ' ', '^', 'longusername'.repeat(4)]

    // Type the password to make sure we're validating the username only
    cy.get('input[name=password]').type('123456')

    invalidUsernames.forEach(username => {
      cy.get('input[name=username]').clear().type(username).blur()
      cy.get('.prompt.label').as('message')

      // Validation error message should appear.
      cy.get('@message').should('be.visible')

      // The error message should indicate that the username is invalid.
      cy.get('@message')
        .contains(
          /Invalid "username"\. Username must contain only letters, numbers, "_", "-", and "\."|"username" length must be less than or equal to 40 characters long/g,
        )
        .should('be.visible')

      // Login button should stay disabled
      cy.get('button').contains('Login').should('be.disabled')
    })
  })
})

describe('Log in form submission', () => {
  const { username, email, password } = getFakeUser()

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
