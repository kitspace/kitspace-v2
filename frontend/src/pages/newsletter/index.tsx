import React from 'react'
import { Button, Container, Form } from 'semantic-ui-react'

import Page from '@components/Page'
import styles from './index.module.scss'

const Newsletter = () => (
  <Page title="Kitspace Newsletter">
    <Container>
      <p>
        Often people say to us: &quot;Wow that&apos;s a nice printed circuit board.
        I would like to subscribe to your newsletter.&quot; Now you can! If
        you&apos;re curious, you can read the latest edition first:{' '}
        <a href="https://buttondown.email/kitspace/archive/kitspace-newsletter-1-assembling-projects/">
          #1: Kitspace Newsletter #1: Assembling Projects.
        </a>{' '}
      </p>
      <p>
        Subscribe below, don&apos;t worry, it&apos;`s easy to unsubscribe if you
        change your mind later. If you prefer, you can also{' '}
        <a href="https://buttondown.email/kitspace/rss">subscribe via RSS</a>. If
        you just want to get in touch email{' '}
        <a href="mailto:info@kitspace.org">info@kitspace.org</a> instead.
      </p>
      <Form
        action="POST"
        className={styles.emailForm}
        data-netlify="true"
        method="POST"
        name="newsletter"
      >
        <input name="form-name" type="hidden" value="newsletter" />
        <Form.Field>
          <label>Your Email:</label>
          <input
            required
            className={styles.emailInput}
            name="email"
            placeholder="you@example.com"
            type="email"
          />
        </Form.Field>
        <div hidden aria-hidden="true">
          <label>
            Don&apos;t fill this out if you&apos;re human:
            <input name="bot-field" />
          </label>
        </div>
        <Button primary type="submit">
          Subscribe
        </Button>
      </Form>
    </Container>
  </Page>
)

export default Newsletter
