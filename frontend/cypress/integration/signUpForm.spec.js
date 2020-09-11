import faker from 'faker'

import { SignUpForm } from '../../models/SignUpForm'

describe('Sign up form validation', () => {
  before(() => {
    cy.visit('/login?sign_up')
  })

  afterEach(() => {
    cy.get('button').contains('Sign up').should('be.disabled')
  })

  it('routes to sign up form based on params', () => {
    cy.contains('Create a new account')
  })

  it('has the proper fields', () => {
    const formFields = SignUpForm.schema().$_terms.keys.map(field => field.key)

    formFields.forEach(field => cy.get(`input[name=${field}]`))
  })

  it('validates username field', () => {
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

      cy.get('@message').should('be.visible')
      cy.get('@message').get('div.header').should('not.be.visible')
      cy.get('@message').should('include.text', '"username"')
    })
  })

  it('validates email field', () => {
    const invalidEmails = ['abc ', 'abc@', ' ', '^', 'www.google.com']

    cy.get('input[name=username]').clear().type('someone')

    invalidEmails.forEach(email => {
      cy.get('input[name=email]').clear().type(email)
      cy.get('.negative').as('message')

      cy.get('@message').should('be.visible')
      cy.get('@message').get('div.header').should('not.be.visible')
      cy.get('@message').should('include.text', '"email"')
    })
  })

  it('validates password field', () => {
    cy.get('input[name=username]').clear().type('someone')
    cy.get('input[name=email]').clear().type('someone@example.com')
    cy.get('input[name=password]').clear().type('12345')
    cy.get('.negative').as('message')

    cy.get('@message').should('be.visible')
    cy.get('@message').get('div.header').should('not.be.visible')
    cy.get('@message').should('include.text', '"password"')
  })
})

describe('Sign up form submission', () => {
  const endpoint = 'http://gitea.kitspace.test:3000/user/kitspace/sign_up'
  const username = faker.name.firstName()
  const email = faker.internet.email()
  const password = '123456'
  const duration = '3 hours'
  beforeEach(() => cy.clearCookies())

  it('submits a valid form', () => {
    cy.visit('/login?sign_up', {
      onBeforeLoad(win) {
        cy.stub(win, 'fetch')
          .withArgs(endpoint)
          .resolves({
            ok: true,
            json: () => ({ email: email, ActiveCodeLives: duration }),
          })
      },
    })

    cy.signUp(username, email, password)

    cy.get('.positive').as('message')

    cy.get('@message').should('be.visible')
    cy.get('@message').get('div.header').should('be.visible')
    cy.get('@message').should('include.text', email)
    cy.get('@message').should('include.text', duration)

    cy.visit('http://gitea.kitspace.test:3000/admin/users?sort=newest')
    cy.get('input#user_name').type(Cypress.env('gitea_admin_username'))
    cy.get('input#password').type(Cypress.env('gitea_admin_password'))
    cy.get('button').click()
    cy.get('tbody').get('tr').contains(username).should('be.visible')
  })
})
