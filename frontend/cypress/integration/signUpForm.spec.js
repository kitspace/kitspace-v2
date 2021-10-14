import faker from 'faker'

import { getFakeUsername } from '../support/getFakeUsername'
import SignUpFormModel from '../../src/models/SignUpForm'

describe('Sign up form validation', () => {
  beforeEach(() => {
    // deauthenticate the user and reload the page to update the CSRF token
    cy.clearCookies()
    cy.reload()

    cy.visit('/login')
  })

  afterEach(() => {
    // All the tests are invalid forms which should keep the button inactive.
    cy.get('button').contains('Sign up').should('be.disabled')
  })

  it('should route to sign up form based on params', () => {
    // The form is rendered on screen.
    cy.contains('Create a new account')
  })

  it('should have the proper fields', () => {
    // The form contains all the fields from the `SingUpForm` model.
    cy.hasProperFields(SignUpFormModel)
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
      cy.get('input[name=username]').clear().type(username).blur()

      // The error message should indicate that the username is invalid.
      cy.get('.prompt.label').as('message')
      cy.get('@message').should('be.visible')
      cy.get('@message').should('include.text', '"username"')
    })
  })

  it('should display error message on using invalid email', () => {
    // Try different invalid emails.
    const invalidEmails = ['abc ', 'abc@', ' ', '^', 'www.google.com']

    cy.get('input[name=username]').clear().type('someone')

    invalidEmails.forEach(email => {
      cy.get('input[name=email]').clear().type(email).blur()

      // The error message should indicate that the email is invalid.
      cy.get('.prompt.label').as('message')
      cy.get('@message').should('be.visible')
      cy.get('@message').should('include.text', '"email"')
    })
  })

  it('should display error message on using invalid password', () => {
    // Try different invalid password.
    cy.get('input[name=username]').clear().type('someone')
    cy.get('input[name=email]').clear().type('someone@example.com')
    cy.get('input[name=password]').clear().type('12345').blur()

    // The error message should indicate that the password is invalid.
    cy.get('.prompt.label').as('message')
    cy.get('@message').should('be.visible')
    cy.get('@message').should('include.text', '"password"')
  })
})

describe('Sign up form submission', () => {
  const username = getFakeUsername()
  const email = faker.unique(faker.internet.email)
  const password = '123456'

  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')

    // Create user used for conflicts test then sing out again.
    cy.visit('/login?sign_up')
    cy.signUp(username, email, password)
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.visit('/login?sign_up')
  })

  it('should automatically sign the user in after submitting a valid form', () => {
    const newUsername = getFakeUsername()
    const newEmail = faker.unique(faker.internet.email)
    const newPassword = '123456'

    cy.signUp(newUsername, newEmail, newPassword)

    // the user should be signed in, i.e., the `session.user` object won't be null
    cy.get('[data-cy=user-menu]').should('be.visible')
    cy.window().then(win => {
      assert(win.session.user, 'Auto sign in.')
    })
  })

  it('should display error message on submitting a from with used username', () => {
    cy.signUp(username, email, password)

    // The error message should indicate that username is already taken.
    cy.get('.negative').as('message')
    cy.get('@message').should('be.visible')
    cy.get('@message').should('include.text', 'User already exists.')
  })

  it('should display error message on submitting a from with used email', () => {
    cy.signUp('newUser', email, password)

    // The error message should indicate that this email is already registered.
    cy.get('.negative').as('message')
    cy.get('@message').should('be.visible')
    cy.get('@message').should('include.text', 'Email is already used.')
  })

  it('should display error message on submitting a from with reserved username', () => {
    const reservedNames = ['admin', 'user'] // Not a full list of Gitea reserved names.

    reservedNames.forEach(name => {
      cy.signUp(name, email, password)

      // The error message should indicate that the username is reserved.
      cy.get('.negative').as('message')
      cy.get('@message').should('be.visible')
      cy.get('@message').should('include.text', 'Name is reserved.')
    })
  })
})
