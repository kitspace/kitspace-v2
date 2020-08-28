import { Button, Grid, Header, Icon } from 'semantic-ui-react'
import React from 'react'

export default function () {
  return (
    <>
      <Header as="h3" textAlign="center">
        Or with
      </Header>
      <Grid columns={3} divided>
        <Grid.Row>
          <Grid.Column>
            <Button color="twitter">
              <Icon name="twitter" /> Twitter
            </Button>
          </Grid.Column>
          <Grid.Column>
            <Button>
              <Icon name="github" /> GitHub
            </Button>
          </Grid.Column>
          <Grid.Column>
            <Button color="blue">
              <Icon name="google" /> Google
            </Button>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  )
}
