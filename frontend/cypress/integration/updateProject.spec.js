import faker from 'faker'

//

describe('Update project form validation', () => {
  const username = faker.name.firstName()
  const email = faker.internet.email()
  const password = '123456'

  const syncedRepoName = 'light-test-repo'
  const uploadedRepoName = 'example'

  before(() => {
    // Create a user
    cy.clearCookies()
    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**').as('sign_in')
    cy.intercept('http://gitea.kitspace.test:3000/api/v1/repos/migrate**').as(
      'sync',
    )

    cy.createUser(username, email, password)
    // sign in, and migrate `light-test-repo`
    cy.visit('/login')
    cy.signIn(username, password)

    cy.wait('@sign_in')

    // migrate `light-test-repo`
    const syncedRepoUrl = 'https://github.com/AbdulrhmnGhanem/light-test-repo'
    // Go to home instead of `wait`
    cy.visit('/')

    cy.visit('/projects/new')
    cy.get('input:first').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()
    cy.wait('@sync')

    // Create a repo by uploading files
    cy.visit('/projects/new') // go back to `projects/new` page as the previous step `sync` will trigger redirect

    // Simulate dropping a single file('example.png') in the dropzone.
    cy.fixture('example.png', 'base64').then(file => {
      cy.get('.dropzone').dropFiles([file], ['example.png'], username)
    })
  })

  beforeEach(() => {
    cy.intercept(`http://gitea.kitspace.test:3000/api/v1/repos/**`).as('getRepo')
  })

  it('should prevent conflicting project names', () => {
    // Make sure the repo has loaded
    cy.intercept(
      'http://gitea.kitspace.test:3000/api/v1/repos/migrate/status',
    ).as('loaded')
    cy.wait('@loaded')

    // Go to the update page for the project created by uploading files
    cy.visit(`/${username}/${uploadedRepoName}`)

    // Change the project name to the name of the synced repo which will cause conflict
    cy.get('[data-cy=update-form-name] > input')
      .clear()
      .type(syncedRepoName, { force: true })

    // The form should show that a project with the same name already exists
    cy.get('.prompt[role=alert]').should('contain.text', syncedRepoName)

    // Prevent submitting the update
    cy.get('[data-cy=update-form-submit]').should('be.disabled')
  })

  it('should prevent names longer than 60 characters', () => {
    const maximumLength = 60
    // Note: longName.length == 61
    const longName = new Array(maximumLength + 2).join('a')

    // Go to the update page for the project created by uploading files
    cy.visit(`/${username}/${uploadedRepoName}`)

    // Change the project name 61+ name which is beyond the maximum allowable
    cy.get('[data-cy=update-form-name] > input').clear().type(longName)

    // The form should show that a project with the same name already exists
    cy.get('.prompt[role=alert]').should(
      'contain.text',
      'must be less than or equal to 60 characters long',
    )

    // Prevent submitting the update
    cy.get('[data-cy=update-form-submit]').should('be.disabled')
  })

  it('should disable updating and warn for synced repos', () => {
    cy.visit(`${username}/${syncedRepoName}`)

    // display the warning message
    cy.get('[data-cy=sync-msg]').should('be.visible')
    // prevent updating
    cy.get('[data-cy=update-form-submit]').should('be.disabled')
  })
})
