import faker from 'faker'

import { SignInForm } from '../../models/SignInForm'

describe('Log in form validation', () => {
  before(() => cy.visit('/login'))

  afterEach(() => cy.get('button').contains('Login').should('be.disabled'))

  it('routes to sign up form based on params', () => {
    // The form is rendered on screen.
    cy.contains('Log in')
  })

  it('has the proper fields', () => {
    // The form contains all the fields from the `SingUpForm` model.
    const formFields = SignInForm.schema().$_terms.keys.map(field => field.key)

    formFields.forEach(field => cy.get(`input[name=${field}]`))
  })

  it('validates username field', () => {
    // Try different invalid usernames.
    const invalidUsernames = ['abc ', 'abc@', ' ', '^', 'ZqFe3jOudI7DuBOJ1wyXT']

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
})

describe('Log in form submission', () => {
  const username = faker.name.firstName()
  const email = faker.internet.email()
  const password = '123456'

  before(() => {
    cy.visit('/login')
    cy.clearCookies()
  })

  it('submits a valid form', () => {
    // create user and log him in.
    cy.createUser(username, email, password)
    cy.stubSignInReq(true, { LoggedInSuccessfully: true })

    cy.signIn(username, password)

    // After a successful login the user is redirect to the homepage.
    cy.url().should('eq', 'http://kitspace.test:3000/')
    // Currently the username is in the homepage body,
    // probably will change in the future
    cy.get('.ui.container').should('include.text', username)

    // Checking the session object is more robust.
    cy.window().its('session.user.username').should('eq', username)
  })

  it('submits form with wrong username', () => {
    cy.stubSignInReq(false, {
      error: 'Not Found',
      message: 'Wrong username or password.',
    })
    cy.signIn('nonRegUser', password)
    cy.get('.negative').should('include.text', 'Wrong username or password')
  })

  it('submits form with wrong username', () => {
    cy.stubSignInReq(false, {
      error: 'Not Found',
      message: 'Wrong username or password.',
    })
    cy.signIn(username, 'wrong_password_1234')
    cy.get('.negative').should('include.text', 'Wrong username or password')
  })

  it('submits form for inactive account', () => {
    cy.stubSignInReq(false, {
      error: 'ActivationRequired',
      message: 'Activate your account.',
    })
    cy.signIn('inactiveUser', password)
    cy.get('.negative').should('include.text', 'Activate your account.')
  })

  it('submits form for prohibited user', () => {
    cy.stubSignInReq(false, {
      error: 'Prohibited',
      message: 'Prohibited login.',
    })
    cy.signIn('prohibitedUser', password)
    cy.get('.negative').should('include.text', 'Prohibited login.')
  })
})
