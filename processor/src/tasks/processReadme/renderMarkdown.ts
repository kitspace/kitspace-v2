import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import type { Options as RehypeSanitizeOptions } from 'rehype-sanitize'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeShiftHeading from 'rehype-shift-heading'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkEmoji from 'remark-emoji'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import urlTransformer from './urlTransformer.js'

const rehypeSanitizeOpts: RehypeSanitizeOptions = {
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
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'ftp', 'ftps', 'ssh', 'mailto', 'tel', 'sms', 'magnet'],
  },
}

export interface RenderMarkdownArgs {
  rawMarkdown: string
  ownerName: string
  repoName: string
  readmeFolder: string
  originalUrl: string
  defaultBranch: string
}

export async function renderMarkdown({
  rawMarkdown,
  ownerName,
  repoName,
  readmeFolder,
  originalUrl,
  defaultBranch,
}: RenderMarkdownArgs) {
  const Remarker = unified()
    .use(remarkParse)
    .use(remarkEmoji)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(urlTransformer, {
      readmeFolder,
      originalUrl,
      ownerName,
      repoName,
      defaultBranch,
    })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
    .use(rehypeShiftHeading, { shift: 1 })
    .use(rehypeHighlight)
    .use(rehypeSanitize, rehypeSanitizeOpts)
    .use(rehypeStringify)

  const processedMarkdown = await Remarker.process(rawMarkdown)
  return String(processedMarkdown)
}
