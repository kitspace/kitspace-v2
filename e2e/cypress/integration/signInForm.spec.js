import faker from 'faker'
import Joi from 'joi'

const SignInFormModel = Joi.object({
  _csrf: Joi.string(),
  username: Joi.string()
    .regex(/^(?:[A-Z\d][A-Z\d_-]{0,19}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4})$/i)
    .messages({
      'string.pattern.base': 'Invalid username or email',
    }),
  password: Joi.string().required(),
  remember: Joi.boolean(),
})

describe('Log in form validation', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    // deauthenticate the user and reload the page to update the CSRF token
    cy.clearCookies()
    cy.reload()

    cy.visit('/login')
  })

  afterEach(() => cy.get('button').contains('Login').should('be.disabled'))

  it('should route to sign in form based on params', () => {
    // The form is rendered on screen.
    cy.contains('Log in')
  })

  it('should have the proper fields', () => {
    // The form contains all the fields from the `SingUpForm` model.
    cy.hasProperFields(SignInFormModel)
  })

  it('should validate username field', () => {
    // Try different invalid usernames.
    const invalidUsernames = ['abc ', 'abc@', ' ', '^', 'ZqFe3jOudI7DuBOJ1wyXT']

    invalidUsernames.forEach(username => {
      cy.get('input[name=username]').clear().type(username)
      cy.get('.prompt.label').as('message')

      // Success header shouldn't appear.
      cy.get('@message').should('be.visible')

      // The error message should indicate that the username is invalid.
      cy.get('@message').should('include.text', 'Invalid username or email')
    })
  })
})

describe('Log in form submission', () => {
  const username = faker.name.firstName()
  const email = faker.internet.email()
  const password = '123456'

  before(() => {
    // create user and log him in.
    cy.createUser(username, email, password)
  })

  beforeEach(() => {
    // deauthenticate the user and reload the page to update the CSRF token
    cy.clearCookies()
    cy.reload()

    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**')
  })

  it('should display username in homepage on submitting a valid form', () => {
    cy.signIn(username, password)

    // After a successful login the user is redirect to the homepage.
    cy.url().should('eq', 'http://kitspace.test:3000/')
    // Currently the username is in the homepage body,
    // probably will change in the future
    cy.get('.ui.container').should('include.text', username)

    // Checking the session object is more robust.
    cy.window().its('session.user.username').should('eq', username)
  })

  it('should display error message on submitting form with wrong username', () => {
    cy.stubSignInReq(false, {
      error: 'Not Found',
      message: 'Wrong username or password.',
    })
    cy.signIn('nonRegUser', password)
    cy.get('.negative').should('include.text', 'Wrong username or password')
  })

  it('should display error message on submitting form with wrong username', () => {
    cy.stubSignInReq(false, {
      error: 'Not Found',
      message: 'Wrong username or password.',
    })
    cy.signIn(username, 'wrong_password_1234')
    cy.get('.negative').should('include.text', 'Wrong username or password')
  })

  it('should display error message on submitting form for inactive account', () => {
    cy.stubSignInReq(false, {
      error: 'ActivationRequired',
      message: 'Activate your account.',
    })
    cy.signIn('inactiveUser', password)
    cy.get('.negative').should('include.text', 'Activate your account.')
  })

  it('should display error message on submitting form for prohibited user', () => {
    cy.stubSignInReq(false, {
      error: 'Prohibited',
      message: 'Prohibited login.',
    })
    cy.signIn('prohibitedUser', password)
    cy.get('.negative').should('include.text', 'Prohibited login.')
  })
})
