import React from 'react'
import { Button, Form } from 'semantic-ui-react'

import { Page } from '../components/Page'

export default function Newsletter() {
  return (
    <Page title="newsletter">
      <p>
        Often people say to us: "Wow that's a nice printed circuit board. I would
        like to subscribe to your newsletter." Now you can! Let us know what would
        like to hear about exactly. Don't worry, it's easy to unsubscribe if you
        change your mind later. If you just want to get in touch email{' '}
        <a href="mailto:info@kitspace.org">info@kitspace.org</a> instead.
      </p>
      <Form
        name="newsletter"
        method="POST"
        data-netlify="true"
        style={{ padding: 15 }}
      >
        <input type="hidden" name="form-name" value="newsletter" />
        <Form.Field>
          <label>Your Email:</label>
          <input
            required
            type="email"
            name="email"
            placeholder="you@example.com"
            style={{ maxWidth: 300 }}
          />
        </Form.Field>
        <div hidden aria-hidden="true">
          <label>
            Don’t fill this out if you're human:
            <input name="bot-field" />
          </label>
        </div>
        <Form.Group grouped>
          <label>Interested in:</label>
          <Form.Field
            label="Updates about Kitspace itself"
            name="updates"
            control="input"
            type="checkbox"
            defaultChecked
          />
          <Form.Field
            label="New projects added"
            name="new_projects"
            control="input"
            type="checkbox"
            defaultChecked
          />
          <Form.Field
            label="Articles and tutorials"
            name="articles"
            control="input"
            type="checkbox"
            defaultChecked
          />
        </Form.Group>
        <Form.Field inline size="tiny">
          <label htmlFor="anything_else">Anything else: </label>
          <input
            style={{ height: 13 }}
            type="text"
            name="anything_else"
            id="anything_else"
          />
        </Form.Field>
        <Button primary type="submit" style={{ marginTop: 30 }}>
          Subscribe
        </Button>
      </Form>
    </Page>
  )
}
