const globule = require('globule')
const path = require('path')
const superagent = require('superagent')
const cheerio = require('cheerio')

const { exists, readFile, writeFile } = require('../utils')
const { GITEA_URL } = require('../env')

function processReadme(events, inputDir, kitspaceYaml, outputDir, projectFullname) {
  if (kitspaceYaml.multi) {
    const projectNames = Object.keys(kitspaceYaml.multi)
    return Promise.all(
      projectNames.map(projectName => {
        const projectOutputDir = path.join(outputDir, projectName)
        const projectKitspaceYaml = kitspaceYaml.multi[projectName]

        return _processReadme(
          events,
          inputDir,
          projectKitspaceYaml,
          projectOutputDir,
          projectFullname,
        )
      }),
    )
  }

  return _processReadme(events, inputDir, kitspaceYaml, outputDir, projectFullname)
}

async function _processReadme(
  events,
  inputDir,
  kitspaceYaml,
  outputDir,
  projectFullname,
) {
  const readmePath = path.join(outputDir, 'readme.html')

  events.emit('in_progress', readmePath)

  if (await exists(readmePath)) {
    events.emit('done', readmePath)
    return
  }

  let readmeInputPath

  if (kitspaceYaml.readme) {
    readmeInputPath = path.join(inputDir, kitspaceYaml.readme)
  } else {
    const readmeFile = findReadmeFile(inputDir)
    if (readmeFile === null) {
      events.emit('failed', readmePath, "couldn't find readme file")
      return
    }
    readmeInputPath = readmeFile
  }

  const rawMarkdown = await readFile(readmeInputPath, { encoding: 'utf8' })
  const readmeAsHTML = await renderMarkdown(rawMarkdown)

  const renderedReadme = postProcessMarkdown(readmeAsHTML, projectFullname)

  await writeFile(readmePath, renderedReadme)
    .then(() => events.emit('done', readmePath))
    .catch(e => events.emit('failed', readmePath, e))
}

function findReadmeFile(inputDir) {
  const readmeFiles = globule.find(
    path.join(inputDir, 'readme?(.markdown|.mdown|.mkdn|.md|.rst)'),
    {
      nocase: true,
    },
  )

  if (readmeFiles.length >= 1) {
    return readmeFiles[0]
  } else {
    return null
  }
}

async function renderMarkdown(rawMarkdown) {
  const giteaMarkdownEndpoint = 'http://gitea:3000/api/v1/markdown/raw'

  const res = await superagent
    .post(giteaMarkdownEndpoint)
    .set('Content-Type', 'application/json')
    .send(rawMarkdown)

  return res.text
}

/**
 * Make urls absolute not relative
 * @param {string} readmeAsHtml
 * @param {string} projectFullname
 * @returns {string}
 */
function postProcessMarkdown(readmeAsHtml, projectFullname) {
  // Replace relative urls with absolute ones for `img` and `a` tags.
  const $ = cheerio.load(readmeAsHtml)
  $('img').each((_, elem) => {
    const img = $(elem)
    const src = img.attr('src')

    if (src.startsWith('/')) {
      const rawUrl = `${GITEA_URL}/${projectFullname}/raw${src}`
      img.attr('src', rawUrl)
    }
  })

  $('a').each((_, elem) => {
    const a = $(elem)
    const href = a.attr('href')
    if (href.startsWith('/')) {
      const rawUrl = `${GITEA_URL}/${projectFullname}/src${href}`
      a.attr('href', rawUrl)
    }
  })

  return $.html()
}

module.exports = processReadme
