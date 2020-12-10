import React from 'react'
import superagent from 'superagent'
import Link from 'next/link'

import { Page } from '../components/Page'
import { Card, Image } from 'semantic-ui-react'
import styles from './index.module.scss'

function Home({ name, _csrf, repos }) {
  return (
    <Page title="home">
      <Card.Group>
        <Link href="/buy/electron-detector">
          <Card className={styles.card}>
            <Image src="/static/electron_detector_kit_thumb.jpg" />
            <Card.Content>
              <Card.Header>Electron Detector Kit</Card.Header>
              <Card.Meta>€30.00</Card.Meta>
              <Card.Description>
                A kit to make your own electron detector, including the PCB.
              </Card.Description>
            </Card.Content>
          </Card>
        </Link>
        <Link href="/buy/electron-detector-parts-only">
          <Card className={styles.card}>
            <Image src="/static/electron_detector_kit_parts_thumb.jpg" />
            <Card.Content>
              <Card.Header>Electron Detector Kit (parts only)</Card.Header>
              <Card.Meta>€28.00</Card.Meta>
              <Card.Description>
                A kit to make your own electron detector, without the PCB.
              </Card.Description>
            </Card.Content>
          </Card>
        </Link>
      </Card.Group>
    </Page>
  )
}

export default Home
