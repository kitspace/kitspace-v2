import { getFakeUser } from '../support/getFakeUser'

describe('Sign up form validation', () => {
  before(() => {
    cy.visit('/login')
    cy.get('a').contains('Sign up').click({ force: true })
  })

  afterEach(() => {
    // All the tests are invalid forms which should keep the button inactive.
    cy.get('button').contains('Sign up').should('be.disabled')
  })

  it('should route to sign up form based on params', () => {
    // The form is rendered on screen.
    cy.contains('Create a new account')
  })

  it('should display error message on using invalid username', () => {
    // Try different invalid usernames.
    const invalidUsernames = ['abc ', 'abc@', ' ', '^', 'longusername'.repeat(4)]

    invalidUsernames.forEach(username => {
      cy.get('input[name=username]').clear().type(username).blur()

      // The error message should indicate that the username is invalid.
      cy.get('.prompt.label').as('message')
      cy.get('@message')
        .contains(
          /Invalid "username"\. Username must contain only letters, numbers, "_", "-", and "\."|"username" length must be less than or equal to 40 characters long|"username" length must be at least 2 characters long/g,
        )
        .should('be.visible')
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
      cy.get('@message').should('include.text', 'Invalid email address')
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
  const { username, email, password } = getFakeUser()

  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')
    cy.clearCookies()

    // Create user used for conflicts test then sign out again.
    cy.visit('/login')
    cy.signUp(username, email, password)
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.visit('/login')
  })

  it('should automatically sign the user in after submitting a valid form', () => {
    const { username, email, password } = getFakeUser()

    cy.signUp(username, email, password)

    // the user should be signed in
    cy.get('[data-cy=user-menu]').should('be.visible')
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

describe('Already have an account? Log in here.', () => {
  it('should open login pane on clicking "Already have an account? Log in here."', () => {
    cy.visit('/login')
    cy.get('[data-cy=log-in-here]').click({ force: true })
    cy.get('h2').contains('Login')
  })
})
