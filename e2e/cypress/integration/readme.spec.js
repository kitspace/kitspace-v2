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
        fetch(src).then(res => {
          assert(res.ok, 'expected "ok" http response when requesting image')
          const contentType = res.headers.get('content-type')
          assert(
            contentType === 'image/png',
            `expected content-type '${contentType}' to be 'image/png'`,
          )
        })
      })
  })

  it('handles readmes in folders', () => {
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    const repoName = 'readmes-in-folders'
    const syncedRepoUrl =
      'https://github.com/kitspace-test-repos/readmes-in-folders'

    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.visit('/projects/new')

    // Migrate the repo
    cy.get('[data-cy=sync-field]').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should('contain', `${username}/${repoName}`)

    cy.forceVisit(`/${username}/${repoName}/project_2`)

    cy.get('[data-cy=readme]').within(() => {
      cy.get('img').each($img => {
        // checks for naturalWidth/naturalHeight are not working
        // $img.error does not seem to be working
        // so we use $img.bind
        $img.bind('error', () => {
          assert(false, `error with loading image: ${$img.attr('src')}`)
        })
        // `scrollIntoView` is not working so we use `click`
        cy.wrap($img).click().should('be.visible')
      })
    })
  })
})
