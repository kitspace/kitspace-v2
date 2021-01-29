import faker from 'faker'

describe('Updating a project behavior validation', () => {
  const username = faker.name.firstName()
  const email = faker.internet.email()
  const password = '123456'

  const testRepoName = 'example'
  const testRepoFullName = `${username}/${testRepoName}`
  const updatePageRoute = `/projects/update/${testRepoFullName}`

  before(() => {
    cy.clearCookies()
    // create a user and sign him in
    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**')
    cy.intercept(`http://gitea.kitspace.test:3000/api/v1/repos/**`)

    cy.createUser(username, email, password)
    cy.visit('/login')
    cy.signIn(username, password)

    // waiting prevents random test failures due to jittering in response
    cy.wait(1000)
    // sync the test repo
    cy.visit('/projects/new/')
    // Simulate dropping a single file('example.png') in the dropzone.
    // So it will create a project named `example`
    cy.intercept(
      `http://gitea.kitspace.test:3000/${testRepoFullName}/upload**`,
    ).as('upload')
    cy.preFileDrop(username)
    cy.fixture('example.png', 'base64').then(file => {
      cy.get('.dropzone').dropFiles([file], ['example.png'])
    })

    // Wait until the file is uploaded otherwise cypress terminates the request
    cy.wait('@upload')
  })

  beforeEach(() => {
    // deauthenticate the user and reload the page to update the CSRF token
    cy.clearCookies()
    cy.reload()

    cy.intercept('http://gitea.kitspace.test:3000/user/kitspace/**').as('sing_in')
    cy.visit('/login')
    cy.signIn(username, password)
    cy.wait('@sing_in')

    cy.intercept(`http://gitea.kitspace.test:3000/api/v1/repos/**`).as('getRepo')
    cy.visit(updatePageRoute)
  })

  it('should render the update page with correct project name', () => {
    cy.visit(updatePageRoute)
    cy.get('[data-cy=update-form-name] > input').should('have.value', testRepoName)
  })

  it('should handle uploading files', () => {
    cy.visit(updatePageRoute)
    // Intercept request for the uploading route
    cy.intercept(
      `http://gitea.kitspace.test:3000/${testRepoFullName}/upload-file**`,
    ).as('upload')

    cy.preFileDrop(username)
    cy.fixture('example2.png', 'base64').then(file => {
      cy.get('.dropzone').dropFiles([file], ['example2.png'])
    })

    // waiting prevents random test failures due to jittering in response
    cy.wait('@upload')
    // Dropping a file should make it appear in the preview component
    cy.get('[data-cy=file-name]').contains('example2.png')

    // Commit files to the repo
    cy.get('[data-cy=update-form-submit]').click()

    // After reloading the update page the files should still in the preview component
    cy.reload()
    cy.get('[data-cy=file-name]').contains('example2.png')
  })

  it('should handle changing project name', () => {
    const newName = 'new-cool-name'

    // Changing the project name a submitting it
    cy.get('[data-cy=update-form-name] > input').clear().type(newName)
    cy.get('[data-cy=update-form-submit]').click()
    cy.wait('@getRepo')
    cy.wait(1000)

    // should redirect to the new update page
    cy.url().should('contain', `/projects/update/${username}/${newName}`)
  })

  it('should handle updating project name and uploading files at the same time', () => {
    // notice that the project name has changed to `new-cool-name` in the previous test
    const testRepoFullName = `${username}/new-cool-name`
    const newName = 'even-cooler-name'

    cy.visit(`/projects/update/${testRepoFullName}`)

    // Update project name to `even-cooler-name`
    cy.get('[data-cy=update-form-name] > input').clear().type(newName)

    // Intercept request for the uploading route
    cy.intercept(
      `http://gitea.kitspace.test:3000/${testRepoFullName}/upload-file**`,
    ).as('upload')

    // Upload `example3.png`
    cy.preFileDrop(username)
    cy.fixture('example3.png', 'base64').then(file => {
      cy.get('.dropzone').dropFiles([file], ['example3.png'])
    })

    cy.wait('@upload')
    // Submit the update form
    cy.get('[data-cy=update-form-submit]').click()

    cy.wait(1000)
    // Should redirect to the new update page
    cy.url().should('contain', `/projects/update/${username}/${newName}`)

    // `example3.png` should be in the preview
    cy.get('[data-cy=file-name]').contains('example3.png')
  })
})

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

    cy.createUser(username, email, password)
    // sign in, and migrate `light-test-repo`
    cy.visit('/login')
    cy.signIn(username, password)

    cy.wait('@sign_in')

    // migrate `light-test-repo`
    const syncedRepoUrl = 'https://github.com/AbdulrhmnGhanem/light-test-repo'

    cy.visit('/projects/new')
    cy.get('input:first').type(syncedRepoUrl)
    cy.get('button').contains('Sync').click()
    cy.syncTestRepo()

    cy.intercept(
      `http://gitea.kitspace.test:3000/api/v1/users/${username}/repos`,
    ).as('getRepos')

    // Create a repo by uploading files
    cy.visit('projects/new')
    cy.preFileDrop(username)

    // Simulate dropping a single file('example.png') in the dropzone.
    cy.fixture('example.png', 'base64').then(file => {
      cy.get('.dropzone').dropFiles([file], ['example.png'])
    })

    // Wait until getting a response from the server then validate a redirection has happened
    cy.wait(['@createRepo', '@getRepo'])
  })

  beforeEach(() => {
    cy.intercept(`http://gitea.kitspace.test:3000/api/v1/repos/${username}/**`).as(
      'getRepo',
    )
  })

  it('should prevent conflicting project names', () => {
    // Go to the update page for the project created by uploading files
    cy.visit(`projects/update/${username}/${uploadedRepoName}`)
    cy.wait(2000)

    // Change the project name to the name of the synced repo which will cause conflict
    cy.get('[data-cy=update-form-name] > input').clear().type(syncedRepoName, {force: true})

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
    cy.visit(`projects/update/${username}/${uploadedRepoName}`)
    cy.wait(2000)

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
})
