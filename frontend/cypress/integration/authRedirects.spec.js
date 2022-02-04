import faker from 'faker'

import { getFakeUsername } from '../support/getFakeUsername'

describe('It validates authentication redirects', () => {
  const username = getFakeUsername()
  const email = faker.unique(faker.internet.email)
  const password = '123456'

  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')
    cy.createUser(username, email, password)
  })

  it("should redirect unauthenticated users to '/login' when accessing require sign in page (server)", () => {
    // Clear the cookies to make sure the user isn't authenticated
    cy.clearCookies()
    // `/project/new` is marked as require sign in.
    cy.forceVisit('/projects/new')
    cy.get('[data-cy=login-grid]').should('be.visible')
  })

  it("should redirect unauthenticated users to '/login' when accessing require sign in page (client)", () => {
    // Clear the cookies to make sure the user isn't authenticated
    cy.clearCookies()
    cy.forceVisit('/')
    // navigate to `/projects/new`with client-side interactions.
    cy.get('#add-project').click({ timeout: 10000 })
    // `/project/new` is marked as require sign in.
    cy.get('[data-cy=login-grid]').should('be.visible')
  })

  /*
   ! There is no (client) version of this because there is no user interaction which will lead to redirecting to `/login`
   ! when the user is already logged in.
   */
  it('should redirect authenticated users to homepage when accessing reqSignOut page (server)', () => {
    // Sign in
    cy.visit('/login')
    cy.signIn(username, password)
    cy.get('[data-cy=user-menu]')

    // `/login` is marked as `reqSignOut`.
    cy.visit('/login')
    cy.get('[data-cy=cards-grid]').should('be.visible')
  })
})

describe('It validates redirects after login', () => {
  const username = getFakeUsername()
  const email = faker.unique(faker.internet.email)
  const password = '123456'

  before(() => {
    cy.visit('/')
    cy.createUser(username, email, password)
  })

  beforeEach(() => {
    // deauthenticate the user and reload the page to update the CSRF token
    cy.clearCookies()
    cy.reload()
  })

  it('should redirect to homepage if there is no redirect query', () => {
    cy.visit('/login')
    // sign the user in.
    cy.signIn(username, password)

    // After a successful login the user is redirect to the homepage.
    cy.url().should('eq', `${Cypress.config().baseUrl}${Cypress.env('home_path')}`)
  })

  it('should redirect to correct page if there is a redirect query', () => {
    const pageClickFrom = 'projects/new'

    cy.visit(pageClickFrom)

    // sign the user in.
    cy.signIn(username, password)
    // redirect to the page in the redirect query parameter
    cy.url().should('eq', `http://kitspace.test:3000/${pageClickFrom}`)
  })

  it("should redirect to the `pathname` if it isn't `login`", () => {
    const requireSignInPage = '/settings'

    cy.visit(requireSignInPage)

    cy.get('[data-cy=login-grid]').should('be.visible')
    cy.signIn(username, password)
    cy.url().should('eq', `http://kitspace.test:3000${requireSignInPage}`)

    cy.get('h1').contains('Settings')
  })
})

describe('It validates redirects after sing up', () => {
  it('should redirect to homepage if there is no redirect query', () => {
    // sign the user up
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    cy.visit('/login')
    cy.signUp(username, email, password)

    // After a successful sign up the user is redirect to the homepage.
    cy.url().should('eq', `${Cypress.config().baseUrl}${Cypress.env('home_path')}`)
  })

  it('should redirect to correct page if there is a redirect query', () => {
    const pageClickFrom = 'projects/new'
    cy.visit(pageClickFrom)
    // sign the user up
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    cy.signUp(username, email, password)

    // redirect to the page in the redirect query parameter
    cy.url().should('eq', `http://kitspace.test:3000/${pageClickFrom}`)
  })

  it("should redirect to the `pathname` if it isn't `login`", () => {
    const requireSignInPage = '/settings'

    cy.visit(requireSignInPage)

    cy.get('[data-cy=login-grid]').should('be.visible')

    // sign the user up
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    cy.signUp(username, email, password)

    cy.url().should('eq', `http://kitspace.test:3000${requireSignInPage}`)
    cy.get('h1').contains('Settings')
  })
})

describe('It validates redirect after logout', () => {
  it('should redirect to login page', () => {
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'
    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)

    // Press the logout button
    cy.get('img[alt=avatar]').trigger('mousemove').click()
    cy.get('#logout').trigger('mousemove').click()

    // should redirect to `/login`
    cy.url().should('eq', 'http://kitspace.test:3000/login')
  })
})

describe('It validates `Add Project` behavior', () => {
  const username = getFakeUsername()
  const email = faker.unique(faker.internet.email)
  const password = '123456'

  before(() => {
    cy.visit('/')
    cy.createUser(username, email, password)
  })

  beforeEach(() => {
    // deauthenticate the user and reload the page to update the CSRF token
    cy.clearCookies()
    cy.reload()
  })

  it('should redirect unauthenticated user to /login?redirect=/projects/new', () => {
    // The user is unauthenticated
    cy.window().its('session.user').should('eq', null)

    // Clicking `Add Project` redirects to the login page.
    // and adds redirect query to `/projects/new/`
    cy.get('#add_project').click()
    cy.url().should('eq', 'http://kitspace.test:3000/login?redirect=/projects/new')
  })

  it('should redirect authenticated user to /projects/new', () => {
    // sign the user in.
    cy.visit('/login')
    cy.signIn(username, password)

    // Clicking `Add Project` redirects to new project page.
    cy.visit('/')
    cy.get('#add_project').click()
    cy.url().should('eq', 'http://kitspace.test:3000/projects/new')
  })
})
