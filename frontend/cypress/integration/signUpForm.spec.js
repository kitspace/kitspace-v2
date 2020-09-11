/// <reference types="../support" />

import faker from 'faker'

import { SignUpForm } from '../../models/SignUpForm'

describe('Sign up form validation', () => {
  before(() => {
    cy.visit('/login?sign_up')
  })

  afterEach(() => {
    // All the tests are invalid forms which should keep the button inactive.
    cy.get('button').contains('Sign up').should('be.disabled')
  })

  it('routes to sign up form based on params', () => {
    // The form is rendered on screen.
    cy.contains('Create a new account')
  })

  it('has the proper fields', () => {
    // The form contains all the fields from the `SingUpForm` model.
    const formFields = SignUpForm.schema().$_terms.keys.map(field => field.key)

    formFields.forEach(field => cy.get(`input[name=${field}]`))
  })

  it('validates username field', () => {
    // Try different invalid usernames.
    const invalidUsernames = [
      'a_b',
      'abc ',
      'abc@',
      ' ',
      '^',
      'ZqFe3jOudI7DuBOJ1wyXT',
    ]

    invalidUsernames.forEach(username => {
      cy.get('input[name=username]').clear().type(username)
      cy.get('.negative').as('message')

      // Success header shouldn't appear.
      cy.get('@message').should('be.visible')
      cy.get('@message').get('div.header').should('not.be.visible')

      // The error message should indicate that the username is invalid.
      cy.get('@message').should('include.text', '"username"')
    })
  })

  it('validates email field', () => {
    // Try different invalid emails.
    const invalidEmails = ['abc ', 'abc@', ' ', '^', 'www.google.com']

    cy.get('input[name=username]').clear().type('someone')

    invalidEmails.forEach(email => {
      cy.get('input[name=email]').clear().type(email)
      cy.get('.negative').as('message')

      // Success header shouldn't appear.
      cy.get('@message').should('be.visible')
      cy.get('@message').get('div.header').should('not.be.visible')

      // The error message should indicate that the email is invalid.
      cy.get('@message').should('include.text', '"email"')
    })
  })

  it('validates password field', () => {
    // Try different invalid password.
    cy.get('input[name=username]').clear().type('someone')
    cy.get('input[name=email]').clear().type('someone@example.com')
    cy.get('input[name=password]').clear().type('12345')
    cy.get('.negative').as('message')

    // Success header shouldn't appear.
    cy.get('@message').should('be.visible')
    cy.get('@message').get('div.header').should('not.be.visible')

    // The error message should indicate that the password is invalid.
    cy.get('@message').should('include.text', '"password"')
  })
})

describe('Sign up form submission', () => {
  const username = faker.name.firstName()
  const email = faker.internet.email()
  const password = '123456'
  const duration = '3 hours'

  beforeEach(() => cy.clearCookies())

  it('submits a valid form', () => {
    cy.stubSignUpReq(true, { email, ActiveCodeLives: duration })

    cy.signUp(username, email, password)

    cy.get('.positive').as('message')

    // Success header should appear.
    cy.get('@message').should('be.visible')
    cy.get('@message').get('div.header').should('be.visible')

    // Success message should indicate that an email has been sent the the user.
    cy.get('@message').should('include.text', email)

    // Success message should indicate the allowed duration to activate the account.
    cy.get('@message').should('include.text', duration)

    // User information should appear in Gitea admin dashboard.
    cy.visit('http://gitea.kitspace.test:3000/admin/users?sort=newest')
    cy.get('input#user_name').type(Cypress.env('gitea_admin_username'))
    cy.get('input#password').type(Cypress.env('gitea_admin_password'))
    cy.get('button').click()
    cy.get('tbody').get('tr').contains(username).should('be.visible')
  })

  it('submits a from with used username', () => {
    cy.stubSignUpReq(false, { error: 'Conflict', message: 'User already exists.' })

    cy.signUp(username, email, password)

    cy.get('.negative').as('message')

    // Success header shouldn't appear.
    cy.get('@message').should('be.visible')
    cy.get('@message').get('div.header').should('not.be.visible')

    // The error message should indicate that username is already taken.
    cy.get('@message').should('include.text', 'User already exists.')
  })

  it('submits a from with used email', () => {
    cy.stubSignUpReq(false, { error: 'Conflict', message: 'Email already used.' })

    cy.signUp(username, email, password)

    cy.get('.negative').as('message')

    // Success header shouldn't appear.
    cy.get('@message').should('be.visible')
    cy.get('@message').get('div.header').should('not.be.visible')

    // The error message should indicate that this email is already registered.
    cy.get('@message').should('include.text', 'Email already used.')
  })

  it('submits a from with reserved username', () => {
    cy.stubSignUpReq(false, { error: 'Conflict', message: 'Name is reserved.' })

    const reservedNames = ['admin', 'user'] // Not a full list of Gitea reserved names.

    reservedNames.forEach(name => {
      cy.signUp(name, email, password)

      cy.get('.negative').as('message')

      // Success header shouldn't appear.
      cy.get('@message').should('be.visible')
      cy.get('@message').get('div.header').should('not.be.visible')

      // The error message should indicate that the username is reserved.
      cy.get('@message').should('include.text', 'Name is reserved.')
    })
  })
})
