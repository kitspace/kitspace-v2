import { NextRequest, NextResponse } from 'next/server'

export const middleware = (request: NextRequest) => {
  if (request.nextUrl.pathname.startsWith('/interactive_bom')) {
    return IBOMLegacyRedirect(request)
  }
}

const IBOMLegacyRedirect = (request: NextRequest) => {
  const legacyIbomQueryParam = Array.from(request.nextUrl.searchParams.keys())[0]
  const ibomProject = legacyIbomQueryParam
    .split('/')
    .slice(1)
    .concat('IBOM')
    .join('/')

  const origin = new URL(request.url).origin
  return NextResponse.redirect(`${origin}/${ibomProject}`)
}
