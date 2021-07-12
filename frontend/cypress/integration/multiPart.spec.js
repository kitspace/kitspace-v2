import faker from 'faker'

describe('Render project cards', () => {
  const syncedRepoUrlMultiParts =
    'https://github.com/kitspace-forks/DIY_particle_detector'
  const syncedRepoUrl = 'https://github.com/kitspace-forks/CH330_Hardware'
  // Currently hardcoded but preferably it should get it from the yaml
  const multiPartsNames = ['alpha-spectrometer', 'electron-detector']
  const multiPartsRepoName = syncedRepoUrlMultiParts.split('/').slice(-1).toString()
  const normalRepoName = 'CH330_Hardware'

  before(() => {
    // visit home before running the tests, instead of using `wait`.
    cy.visit('/')
  })

  it('should render a card for each multiproject', () => {
    const username = faker.name.firstName()
    const email = faker.internet.email()
    const password = '123456'

    const repoName = syncedRepoUrlMultiParts.split('/').slice(-1).toString()

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

    // Migrate the multipart repo
    cy.get('input:first').type(syncedRepoUrlMultiParts)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url().should('contain', `${username}/${repoName}`)
    // Wait for the repo to finish migration, by checking if sync message has appeared.
    cy.get('[data-cy=sync-msg]', { timeout: 60_000 }).should('be.visible')

    cy.visit(`/${username}`)

    multiPartsNames.forEach(name => {
      cy.get('[data-cy=project-card]').contains(name)
    })
  })

  it('should display card thumbnails', () => {
    const username = faker.name.firstName()
    const email = faker.internet.email()
    const password = '123456'

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

    // Migrate the multipart repo
    cy.get('input:first').type(syncedRepoUrlMultiParts)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url().should('contain', `${username}/${multiPartsRepoName}`)
    // Wait for the repo to finish migration, by checking if sync message has appeared.
    cy.get('[data-cy=sync-msg]', { timeout: 60_000 }).should('be.visible')

    /* Migrate the normal repo */
    cy.visit('/projects/new')

    cy.intercept('http://gitea.kitspace.test:3000/api/v1/repos/migrate**')

    cy.url().then(url => {
      if (!url.endsWith('/projects/new')) {
        cy.visit('/projects/new')
      }
    })

    cy.get('input:first').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url().should('contain', `${username}/${normalRepoName}`)
    // Wait for the repo to finish migration, by checking if sync message has appeared.
    cy.get('[data-cy=sync-msg]', { timeout: 60_000 }).should('be.visible')

    cy.visit(`/${username}`)
    // There should be 3 thumbnails = 2 form multiparts + 1 normal project
    cy.get('[data-cy=project-card-thumbnail]').should(
      'have.length',
      multiPartsNames.length + 1,
    )
  })

  it('should redirect to the multi project page', () => {
    const username = faker.name.firstName()
    const email = faker.internet.email()
    const password = '123456'

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

    /* Migrate the multipart repo */
    cy.get('input:first').type(syncedRepoUrlMultiParts)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url().should('contain', `${username}/${multiPartsRepoName}`)
    // Wait for the repo to finish migration, by checking if sync message has appeared.
    cy.get('[data-cy=sync-msg]', { timeout: 60_000 }).should('be.visible')

    /* Migrate the normal repo */
    cy.visit('/projects/new')

    cy.intercept('http://gitea.kitspace.test:3000/api/v1/repos/migrate**')

    cy.url().then(url => {
      if (!url.endsWith('/projects/new')) {
        cy.visit('/projects/new')
      }
    })

    cy.get('input:first').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()

    // Wait for redirection for project page
    cy.url().should('contain', `${username}/${normalRepoName}`)
    // Wait for the repo to finish migration, by checking if sync message has appeared.
    cy.get('[data-cy=sync-msg]', { timeout: 60_000 }).should('be.visible')

    // Go to the home page and click on a multipart project card
    const multiPartName = multiPartsNames[0]
    cy.visit('/')
    cy.get('[data-cy=project-card]').contains(multiPartName).click()

    // Should redirect to the `[username]/[projectName]/[multiProject]`
    cy.url().should('contain', `${username}/${multiPartsRepoName}/${multiPartName}`)

    // Go to the home page and click on a normal project card
    cy.visit('/')
    cy.get('[data-cy=project-card]').contains(normalRepoName).click()
    // Should redirect to the `[username]/[projectName]/[multiProject]`
    cy.url().should('contain', `${username}/${normalRepoName}`)
  })
})
