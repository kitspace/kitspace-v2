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
    const syncedRepoUrl = 'https://github.com/kitspace-test-repos/CH330_Hardware'

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
          assert(
            res.headers.get('content-type') === 'image/png',
            'expected http response to have content-type image/png',
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
    cy.get('[data-cy=project-card]', { timeout: 20_000 }).should('have.length', 2)

    cy.visit(`/${username}/${repoName}/project_2`)
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

  it('redirects relative urls to original git service', () => {
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
    cy.get('[data-cy=project-card]', { timeout: 20_000 }).should('have.length', 2)

    cy.visit(`/${username}/${repoName}/project_1`)

    cy.get('[data-cy=readme]').within(() => {
      cy.get('a').each($a => {
        cy.request($a[0].href).its('status').should('equal', 200)
      })
    })
  })
})

describe('Readme style', () => {
  it('should auto link readme and summary links', () => {
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    const repoName = 'readme-and-summary-auto-link'
    const syncedRepoUrl =
      'https://github.com/kitspace-test-repos/readme-and-summary-auto-link'

    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    // Migrate the repo
    cy.get('[data-cy=sync-field]').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should('contain', `${username}/${repoName}`)
    // Wait for the repo to finish processing, by checking the visibility of info-bar.
    cy.get('[data-cy=info-bar]', { timeout: 60_000 }).should('be.visible')

    // Auto link summary urls
    cy.get('[data-cy=project-description] a')
      // the link in the project description is `github.com/kitspace-test-repos/readme-and-summary-auto-link`
      .should('contain.text', syncedRepoUrl.slice(8))
      .each($a => {
        cy.request($a[0].href).its('status').should('equal', 200)
      })

    // Auto link readme urls
    cy.get('[data-cy=readme] a')
      // the link in the project description is `https://github.com/kitspace-test-repos/readme-and-summary-auto-link`
      .should('contain.text', syncedRepoUrl)
      .each($a => {
        cy.request($a[0].href).its('status').should('equal', 200)
      })
  })

  it('should render :emoji: in readme and project description', () => {
    const username = getFakeUsername()
    const email = faker.unique(faker.internet.email)
    const password = '123456'

    const repoName = 'ogx360'
    const syncedRepoUrl = 'https://github.com/kitspace-test-repos/ogx360'

    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    // Migrate the repo
    cy.get('[data-cy=sync-field]').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url({ timeout: 60_000 }).should('contain', `${username}/${repoName}`)
    // Wait for the repo to finish processing, by checking the visibility of info-bar.
    cy.get('[data-cy=info-bar]', { timeout: 60_000 }).should('be.visible')

    // the project description isAdd modern xinput USB support to your Original 📺 🎮
    cy.get('[data-cy=project-description]').should('contain.text', '📺 🎮')
    cy.get('[data-cy=readme]').should('contain.text', '🤓')
  })
})
