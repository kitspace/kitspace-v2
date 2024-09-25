import React from 'react'
import { promises as fs } from 'fs'
import path from 'path'
import IBOM from '@components/Board/IBOM'
import getConfig from 'next/config'

const assetUrl = getConfig().publicRuntimeConfig.KITSPACE_PROCESSOR_ASSET_URL

export const getServerSideProps = async ({ params }) => {
  const IBOMHtml = await fs.readFile(
    path.join(process.cwd(), 'public/static/IBOM/index.html'),
    'utf-8',
  )

  const repoFullName = `${params.user}/${params.repo}`

  const res = await fetch(
    `${assetUrl}/${repoFullName}/HEAD/${params.project}/interactive_bom.json`,
  )

  if (!res.ok) {
    return {
      notFound: true,
    }
  }

  const pcbData = await res.blob().then(b => b.text())

  return {
    props: {
      projectFullname: repoFullName,
      html: IBOMHtml,
      pcbData,
      projectHref: `${repoFullName}/${params.project}`,
    },
  }
}

const IBOMPage = props => <IBOM {...props} />
export default IBOMPage
