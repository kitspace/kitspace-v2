import faker from 'faker'

describe('Render correct numbers of cards', () => {
  const username = faker.name.firstName()
  const email = faker.internet.email()
  const password = '123456'

  const syncedRepoUrl = 'https://github.com/kitspace-forks/DIY_particle_detector'
  // Currently hardcoded but preferably it should get it from the yaml
  const multiPartsNames = ['alpha-spectrometer', 'electron-detector']
  const repoName = syncedRepoUrl.split('/').slice(-1).toString()

  before(() => {
    // visit home before running the tests, instead of using `wait`.
    cy.visit('/')
  })

  it('should render a card for each sub project', () => {
    cy.clearCookies()
    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**').as('sign_in')

    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)
    cy.wait('@sign_in')

    cy.visit('/projects/new')

    cy.intercept('http://gitea.kitspace.test:3000/api/v1/repos/migrate**')

    cy.url().then(url => {
      if (!url.endsWith('/projects/new')) {
        cy.visit('/projects/new')
      }
    })

    // Migrate the repo
    cy.get('input:first').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url().should('contain', `${username}/${repoName}`)
    // Wait for the repo to finish migration, by checking if sync message has appeared.
    cy.get('[data-cy=sync-msg]', { timeout: 60_000 }).should('be.visible')

    cy.visit(`/${username}`)

    multiPartsNames.forEach(name => {
      cy.get('.ui.card').contains(name)
    })
  })
})
