// middleware.ts
import { NextResponse } from 'next/server'

// The redirection between the different proxied services corrupts SSL somehow.
// As a workaround we redirect using http:// and nginx will automatically upgrade it to https://.
const sslWorkaround = url => {
  url = new URL(url)
  url.protocol = 'http:'
  return url.toString().slice(0, -1) // remove the trailing slash
}

const No_SSL_KITSPACE_PROCESSOR_URL = sslWorkaround(
  process.env.KITSPACE_PROCESSOR_URL,
)

/* 
 * Make the 1-click-bom.tsv file accessible to the 1-click-bom extension.
 * We can't use the following snippet `next.config.js` redirects: it generates the redirect URLs during the build time of the container.
 * But the KITSPACE_PROCESSOR_URL is only available at runtime.
 {
  source: '/:user/:repo/:project/1-click-BOM.tsv',
  destination: `${process.env.KITSPACE_PROCESSOR_URL}/files/:user/:repo/HEAD/:project/1-click-BOM.tsv`,
  permanent: true,
 }
*/
export function middleware(request) {
  // We are using the pattern because simply using ':user/:repo/:project/1-click-BOM.tsv' matches `/static/` files as well.
  const matches = request.nextUrl.pathname.match(
    /^\/(?<user>.+)\/(?<repo>.+)\/(?<project>.+)\/(?:1-click-BOM.tsv)$/,
  )
  if (matches) {
    const { user, repo, project } = matches.groups
    return NextResponse.redirect(
      `${No_SSL_KITSPACE_PROCESSOR_URL}/files/${user}/${repo}/HEAD/${project}/1-click-BOM.tsv`,
    )
  }
}
