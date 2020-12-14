/// <reference types="../support" />

import faker from 'faker'

import { SignUpForm } from '@/models/SignUpForm'

describe('Sign up form validation', () => {
  before(() => {
    cy.signOut()
    cy.visit('/login?sign_up')
  })

  beforeEach(() => {
    cy.visit('/login?sign_up')
    cy.signOut()
  })

  afterEach(() => {
    // All the tests are invalid forms which should keep the button inactive.
    cy.get('button').contains('Sign up').should('be.disabled')
  })

  it('should route to sign up form based on params', () => {
    // The form is rendered on screen.
    cy.visit('/login?sign_up')
    cy.contains('Create a new account')
  })

  it('should have the proper fields', () => {
    // The form contains all the fields from the `SingUpForm` model.
    cy.hasProperFields(SignUpForm)
  })

  it('should display error message on using invalid username', () => {
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
      cy.get('.prompt.label').as('message')

      // Success header shouldn't appear.
      cy.get('@message').should('be.visible')
      cy.get('@message').get('div.header').should('not.be.visible')

      // The error message should indicate that the username is invalid.
      cy.get('@message').should('include.text', '"username"')
    })
  })

  it('should display error message on using invalid email', () => {
    // Try different invalid emails.
    const invalidEmails = ['abc ', 'abc@', ' ', '^', 'www.google.com']

    cy.get('input[name=username]').clear().type('someone')

    invalidEmails.forEach(email => {
      cy.get('input[name=email]').clear().type(email)
      cy.get('.prompt.label').as('message')

      // Success header shouldn't appear.
      cy.get('@message').should('be.visible')
      cy.get('@message').get('div.header').should('not.be.visible')

      // The error message should indicate that the email is invalid.
      cy.get('@message').should('include.text', '"email"')
    })
  })

  it('should display error message on using invalid password', () => {
    // Try different invalid password.
    cy.get('input[name=username]').clear().type('someone')
    cy.get('input[name=email]').clear().type('someone@example.com')
    cy.get('input[name=password]').clear().type('12345')
    cy.get('.prompt.label').as('message')

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

  before(() => cy.signOut())

  beforeEach(() => {
    cy.visit('/login?sign_up')
    cy.signOut()
  })

  it('should display success message on submitting a valid form', () => {
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
    cy.goToUsersAdminPanel()
    cy.get('tbody').get('tr').contains(username).should('be.visible')
  })

  it('should display error message on submitting a from with used username', () => {
    cy.stubSignUpReq(false, { error: 'Conflict', message: 'User already exists.' })

    cy.signUp(username, email, password)

    cy.get('.negative').as('message')

    // Success header shouldn't appear.
    cy.get('@message').should('be.visible')
    cy.get('@message').get('div.header').should('not.be.visible')

    // The error message should indicate that username is already taken.
    cy.get('@message').should('include.text', 'User already exists.')
  })

  it('should display error message on submitting a from with used email', () => {
    cy.stubSignUpReq(false, { error: 'Conflict', message: 'Email already used.' })

    cy.signUp(username, email, password)

    cy.get('.negative').as('message')

    // Success header shouldn't appear.
    cy.get('@message').should('be.visible')
    cy.get('@message').get('div.header').should('not.be.visible')

    // The error message should indicate that this email is already registered.
    cy.get('@message').should('include.text', 'Email already used.')
  })

  it('should display error message on submitting a from with reserved username', () => {
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
