import { getFakeUser } from '../support/getFakeUser'

describe('Relative README images URLs normalization', () => {
  before(() => {
    /*
     * The purpose of this isn't actually visiting the homepage.
     * Sometimes, the frontend has a slow startup time which results in a random failure.
     */
    cy.visit('/')
  })

  it('handles readme images starting with `/`', () => {
    const user = getFakeUser()

    const repoName = 'CH330_Hardware'
    const syncedRepoUrl = 'https://github.com/kitspace-test-repos/CH330_Hardware'

    // Migrate the repo
    cy.importRepo(syncedRepoUrl, repoName, user)

    cy.visit(`${user.username}/${repoName}`)

    cy.get('[data-cy=readme-img]', { timeout: 60_000 })
      .should('have.attr', 'src')
      .then(src =>
        fetch(src).then(res => {
          assert(res.ok, 'expected "ok" http response when requesting image')
          assert(
            res.headers.get('content-type').startsWith('image/'),
            'expected http response to have content-type image/*',
          )
        }),
      )
  })

  it('handles readmes in folders', () => {
    const user = getFakeUser()

    const repoName = 'readmes-in-folders'
    const syncedRepoUrl =
      'https://github.com/kitspace-test-repos/readmes-in-folders'

    // Migrate the repo
    cy.importRepo(syncedRepoUrl, repoName, user)

    cy.visit(`${user.username}/${repoName}`)
    cy.get('[data-cy=project-card]', { timeout: 20_000 }).should('have.length', 2)

    cy.visit(`/${user.username}/${repoName}/project_2`)
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
    const user = getFakeUser()

    const repoName = 'readmes-in-folders'
    const syncedRepoUrl =
      'https://github.com/kitspace-test-repos/readmes-in-folders'

    // Migrate the repo
    cy.importRepo(syncedRepoUrl, repoName, user)

    cy.visit(`${user.username}/${repoName}`)
    cy.get('[data-cy=project-card]', { timeout: 20_000 }).should('have.length', 2)

    cy.visit(`/${user.username}/${repoName}/project_1`)

    cy.get('[data-cy=readme]').within(() => {
      cy.get('a').each($a => {
        const href = $a[0].href
        if (href.endsWith('.png')) {
          assert(
            href.startsWith('https://github.com/'),
            'expected relative url to be to github',
          )
        }
      })
    })
  })
})

describe('Readme style', () => {
  it('should auto link readme and summary links', () => {
    const user = getFakeUser()

    const repoName = 'readme-and-summary-auto-link'
    const syncedRepoUrl =
      'https://github.com/kitspace-test-repos/readme-and-summary-auto-link'

    // Migrate the repo
    cy.importRepo(syncedRepoUrl, repoName, user)

    cy.visit(`/${user.username}/${repoName}`)

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

  it('renders :emoji: in readme and project description', () => {
    const user = getFakeUser()

    const repoName = 'ogx360'
    const syncedRepoUrl = 'https://github.com/kitspace-test-repos/ogx360'

    // Migrate the repo
    cy.importRepo(syncedRepoUrl, repoName, user)

    cy.visit(`/${user.username}/${repoName}`)

    // Wait for the repo to finish processing, by checking the visibility of info-bar.
    cy.get('[data-cy=info-bar]', { timeout: 60_000 }).should('be.visible')

    // the project description isAdd modern xinput USB support to your Original 📺 🎮
    cy.get('[data-cy=project-description]').should('contain.text', '📺 🎮')
    cy.get('[data-cy=readme]').should('contain.text', '🤓')
  })

  it('preserves URLs for GitHub Actions badges', () => {
    const user = getFakeUser()

    const repoName = 'ogx360'
    const syncedRepoUrl = 'https://github.com/kitspace-test-repos/ogx360'

    // Migrate the repo
    cy.importRepo(syncedRepoUrl, repoName, user)

    cy.visit(`/${user.username}/${repoName}`)

    // Wait for the repo to finish processing, by checking the visibility of info-bar.
    cy.get('[data-cy=info-bar]', { timeout: 60_000 }).should('be.visible')

    // The first image in the readme is the GitHub Actions badge.
    cy.get('[data-cy=readme] img')
      .first()
      .each($img => {
        cy.request($img[0].src).its('status').should('equal', 200)
      })
  })
})
