import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../../src/tasks/processReadme/renderMarkdown'

describe('readme processing', function () {
  it('processes readme with invalid <a> tags', async function () {
    const invalidTagReadme = `
    # 8BitmixtapeNEO_ShenzhenReady
    summary: <a summary for your project>
    site: https://8bitmixtape.github.io/NeoWiki
    `
    const args = {
      rawMarkdown: invalidTagReadme,
      ownerName: 'test',
      repoName: 'test',
      readmeFolder: 'test',
      originalUrl: 'https://github.com/kitspace/test',
      defaultBranch: 'main',
    }
    // if it throws an error this test will fail
    await renderMarkdown(args)
  })

  it('does not treat mailto as a relative URL', async function () {
    const readmeWithMailto = 'Copyright Example (example124@example.com ) 2015-2018'

    const args = {
      rawMarkdown: readmeWithMailto,
      ownerName: 'test',
      repoName: 'test',
      readmeFolder: 'test',
      originalUrl: 'https://github.com/kelu124/bomanz/',
      defaultBranch: 'main',
    }
    const html = await renderMarkdown(args)
    expect(html).toContain('href="mailto:example124@example.com"')
  })

  it('does not treat urls starting with a TCP protocol as a relative URL', async function () {
    const readmeWitSshURL =
      "I don't know why someone would put ssh url in a readme: [but just in case](ssh://git@github.com:kitspace/kitspace-v2.git)"
    const args = {
      rawMarkdown: readmeWitSshURL,
      ownerName: 'test',
      repoName: 'test',
      readmeFolder: 'test',
      originalUrl: 'https://github.com/kelu124/bomanz/',
      defaultBranch: 'main',
    }
    const html = await renderMarkdown(args)
    expect(html).toContain('href="ssh://git@github.com:kitspace/kitspace-v2.git"')
  })
})
