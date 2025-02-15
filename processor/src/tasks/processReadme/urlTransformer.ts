import { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { defaultSchema } from 'rehype-sanitize'
import type { Options as RehypeSanitizeOptions } from 'rehype-sanitize'

import { GITEA_URL } from '../../env.js'
import { isRelativeUrl, normalizeRelativeUrl } from '../../utils.js'

function toGitHubRawUrl(url: string) {
  const parsedUrl = new URL(url)

  const isGitHubUrl = parsedUrl.hostname === 'github.com'
  const isUserAttachments = parsedUrl.pathname.startsWith('/user-attachments/')

  if (isGitHubUrl && !isUserAttachments) {
    parsedUrl.hostname = 'raw.githubusercontent.com'
    const urlPath = parsedUrl.pathname.split('/')
    // Avoid modifying github actions status badges.
    const isWorkflowPath = ['workflows', 'actions'].includes(urlPath?.[3])

    if (!isWorkflowPath) {
      // Remove `/blob/` or '/raw/' from the path.
      parsedUrl.pathname = urlPath.slice(0, 3).concat(urlPath.slice(4)).join('/')
      url = parsedUrl.toString()
    }
  }
  return url
}

interface URLParserArgs {
  readmeFolder: string
  originalUrl?: string
  ownerName?: string
  repoName?: string
  defaultBranch?: string
}

function HrefModifier({ readmeFolder, originalUrl }: URLParserArgs) {
  return (src: string) => {
    if (isRelativeUrl(src)) {
      src = normalizeRelativeUrl(src, readmeFolder)
      // the `/-/` is equivalent to `/HEAD/` but works for both GitHub and GitLab.
      const rawUrl = `${originalUrl}/blob/-/${src}`
      src = rawUrl
    }
    return src
  }
}

function SrcModifier({
  readmeFolder,
  ownerName,
  repoName,
  defaultBranch,
}: URLParserArgs) {
  return (href: string) => {
    const baseUrl = `${GITEA_URL}/${ownerName}/${repoName}/raw/branch/${defaultBranch}`

    if (isRelativeUrl(href)) {
      href = normalizeRelativeUrl(href, readmeFolder)
      href = `${baseUrl}/${href}`
    } else {
      href = toGitHubRawUrl(href)
    }
    return href
  }
}

function urlTransformer({
  originalUrl,
  readmeFolder,
  ownerName,
  repoName,
  defaultBranch,
}: URLParserArgs) {
  return function transform(tree) {
    visit(tree, 'element', node => {
      switch (node.tagName) {
        case 'a':
          modifyUrl(node, 'href', HrefModifier({ readmeFolder, originalUrl }))
          node.properties.target = '_blank'
          node.properties.rel = 'noopener noreferrer'
          break
        case 'img':
          modifyUrl(
            node,
            'src',
            SrcModifier({ readmeFolder, ownerName, repoName, defaultBranch }),
          )
          node.properties.loading = 'lazy'
          node.properties['data-cy'] = 'readme-img'
          break
        default:
          break
      }
    })
  }

  function modifyUrl(
    node,
    prop: 'href' | 'src',
    modifier: ReturnType<typeof SrcModifier>,
  ) {
    if (node.properties[prop]) {
      const newURL = modifier(node.properties[prop])
      node.properties[prop] = newURL
    }
  }
}

export const rehypeSanitizeOpts: RehypeSanitizeOptions = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [
      ...(defaultSchema.attributes.img || []),
      ['loading', 'lazy'],
      ['data-cy'],
    ],
    span: [...(defaultSchema.attributes.span || []), ['className']],
    code: [...(defaultSchema.attributes.code || []), ['className']],
  },
}

export default urlTransformer as Plugin
