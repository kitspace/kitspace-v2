import React from 'react'
import { promises as fs } from 'fs'
import path from 'path'
import getConfig from 'next/config'

import IBOM from '@components/Board/IBOM'

const processorUrl = getConfig().publicRuntimeConfig.KITSPACE_PROCESSOR_URL

export const getServerSideProps = async ({ params }) => {
  const IBOMHtml = await fs.readFile(
    path.join(process.cwd(), 'public/static/IBOM/index.html'),
    'utf-8',
  )

  const projectFullname = `${params.username}/${params.projectName}`
  const interactiveBOMStatus = await fetch(
    `${processorUrl}/status/${projectFullname}/HEAD/interactive_bom.json`,
  )
    .then(r => r.json().then(body => body.status))
    .catch(() => 'fail')

  if (interactiveBOMStatus === 'done') {
    const pcbData = await fetch(
      `${processorUrl}/files/${projectFullname}/HEAD/interactive_bom.json`,
    ).then(res => res.blob().then(b => b.text()))

    return {
      props: {
        projectFullname,
        html: IBOMHtml,
        pcbData,
        projectHref: projectFullname,
      },
    }
  }
  return {
    notFound: true,
  }
}

const IBOMPage = props => <IBOM {...props} />
export default IBOMPage
