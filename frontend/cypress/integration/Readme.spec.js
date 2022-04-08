import faker from 'faker'

import { getFakeUsername } from '../support/getFakeUsername'

describe('Relative README images URLs normalization', () => {
  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')
  })

  it('should be able to fetch relative README image', () => {
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    const repoName = 'CH330_Hardware'
    const syncedRepoUrl = 'https://github.com/kitspace-forks/CH330_Hardware'

    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    // Migrate the repo
    cy.get('[data-cy=sync-field]').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should('contain', `${username}/${repoName}`)

    cy.get('[data-cy=relative-readme-img]', { timeout: 60_000 })
      .should('have.attr', 'src')
      .then(src => {
        fetch(src).then(res => assert(res.ok, 'readme image found!'))
      })
  })
})
