import { getFakeUser } from '../support/getFakeUser'

describe('Upload project', () => {
  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')
  })

  it('should create a project and redirect to its update route on file drop', () => {
    const { username, email, password } = getFakeUser()

    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    // Simulate dropping a single file('example.png') in the dropzone.
    cy.fixture('example.png', 'base64').then(file => {
      cy.get('[data-cy=dropzone]').dropFiles([file], ['example.png'], username)
    })

    cy.get('[data-cy=creating-project-loader]')
    cy.url().should('eq', `${Cypress.config().baseUrl}/${username}/example.png`)

    // TODO FIXME, when writing test for project page
    // cy.get('[data-cy=file-name]', { timeout: 15000 }).contains('example.png')
  })
})

describe('User projects name collision', () => {
  const { username, email, password } = getFakeUser()

  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')

    // User authentication is done in `before` because this spec test name collisions for the same user.
    // i.e., the same user is used for all tests in this spec.
    cy.createUser(username, email, password)
    cy.visit('/')
    cy.get('[data-cy=user-menu]')

    cy.forceVisit('/projects/new')

    // Simulate dropping a single file('example.png') in the dropzone.
    cy.fixture('example.png', 'base64').then(file => {
      cy.get('[data-cy=dropzone]').dropFiles([file], ['example.png'])
    })

    cy.get('[data-cy=creating-project-loader]')
    cy.url().should('include', `${username}/example.png`)
  })

  beforeEach(() => {
    // Don't sign out before each test; the same user is used for all tests in this spec.
    Cypress.Cookies.preserveOnce('_csrf', 'i_like_gitea')
  })

  it('should show modal on project names collision', () => {
    cy.forceVisit('/projects/new')
    // Simulate dropping a single file('example.png') in the dropzone.
    cy.fixture('example.png', 'base64').then(file => {
      cy.get('[data-cy=dropzone]').dropFiles([file], ['example.png'])
    })

    // Collision modal should open
    cy.get('[data-cy=collision-modal]').should('be.visible')

    // The update button should get rendered and the different name button shouldn't exist.
    cy.get('[data-cy=collision-different-name]').should('not.exist')
    cy.get('[data-cy=collision-update]').should('be.enabled')
  })

  it('should commit files to the same project on `Update existing project`', () => {
    cy.forceVisit('/projects/new')
    // Dropping a single file with the same name as an existing project(example)
    // will trigger a name collision

    // Simulate dropping two files ('example.png', 'example2.png') in the dropzone.
    cy.fixture('example.png', 'base64').then(f1 => {
      cy.fixture('example2.png', 'base64').then(f2 => {
        cy.get('[data-cy=dropzone]').dropFiles(
          [f1, f2],
          ['example.png', 'example2.png'],
        )
      })
    })

    // Choose `Update existing project`
    cy.get('[data-cy=collision-update]').click()

    // redirect to the upload page
    cy.url().should('eq', `${Cypress.config().baseUrl}/${username}/example.png`)

    // TODO FIXME, when writing test for project page
    // The new file is committed and on the update page
    // cy.get('[data-cy=file-name]').contains('example2.png')
  })

  // TODO FIXME, after fixing the name collision modal
  // it('should create a project and redirect to its update route on `Choose different name`', () => {
  //   // Dropping a single file with the same name as an existing project(example)
  //   // will trigger a name collision

  //   // Simulate dropping a single file('example.png') in the dropzone.
  //   cy.fixture('example.png', 'base64').then(f1 => {
  //     cy.fixture('example2.png', 'base64').then(f2 => {
  //       cy.get('.dropzone').dropFiles([f1, f2], ['example.png', 'example2.png'])
  //     })
  //   })

  //   // Choose `Choose different name`
  //   const newName = faker.company.companyName()
  //   cy.get('input[name=name]').clear().type(newName)

  //   // On changing the project name the `Update existing project` button should be disabled
  //   cy.get('[data-cy=collision-update]').should('be.disabled')

  //   cy.get('[data-cy=collision-different-name]').click()

  //   cy.wait('@getRepo')

  //   // Clicking the `Choose different name` should create a new repo and redirects to its update page
  //   cy.url().should('eq', `${updateProjectUrl}/${username}/${newName}`)

  //   // Both files dropped should be in the update page
  //   cy.get('[data-cy=file-name]').contains('example.png')
  //   cy.get('[data-cy=file-name]').contains('example2.png')
  // })

  // it('should reject files bigger than `MAX_FILE_SIZE`', () => {
  //   cy.intercept(
  //     `http://gitea.kitspace.test:3000/${username}/big/upload-file**`,
  //   ).as('upload-big')

  //   //   Simulate dropping a single file('example.png') in the dropzone.
  //   cy.fixture('auto-gen/big.txt', 'base64').then(file => {
  //     cy.get('.dropzone').dropFiles([file], ['big.txt'])
  //   })

  //   // Wait additional 10s when when intercepting the response
  //   cy.wait(10000)
  //   cy.wait('@upload-big').its('response.statusCode').should('eq', 413)
  // })
})
