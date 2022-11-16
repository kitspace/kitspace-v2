import { describe, it } from 'vitest'
import { renderMarkdown } from '../../src/tasks/processReadme/renderMarkdown'

const invalidTagReadme = `# 8BitmixtapeNEO_ShenzhenReady

summary: <a summary for your project>
site: https://8bitmixtape.github.io/NeoWiki
`

describe('readme processing', function () {
  it('processes readme with invalid <a> tags', async function () {
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
})
