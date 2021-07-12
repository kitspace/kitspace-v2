import React from 'react'
import { promises as fs } from 'fs'
import path from 'path'

import IBOM from '@components/Board/IBOM'

export const getServerSideProps = async ({ params }) => {
  const IBOMHtml = await fs.readFile(
    path.join(process.cwd(), 'public/static/IBOM/index.html'),
    'utf-8',
  )

  const processorUrl = process.env.KITSPACE_PROCESSOR_URL
  const repoFullname = `${params.username}/${params.projectName}`
  const interactiveBOMStatus = await fetch(
    `${processorUrl}/status/${repoFullname}/HEAD/interactive_bom.json`,
  ).then(r => r.json().then(body => body.status))

  if (interactiveBOMStatus === 'done') {
    const pcbData = await fetch(
      `${processorUrl}/files/${repoFullname}/HEAD/interactive_bom.json`,
    ).then(res => res.blob().then(b => b.text()))

    return {
      props: { repoFullname, html: IBOMHtml, pcbData },
    }
  }
  return {
    notFound: true,
  }
}

const _IBOM = props => <IBOM {...props} />
export default _IBOM
