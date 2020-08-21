import React from 'react'
import { Container, Grid, Tab } from 'semantic-ui-react'
import TitleBar from '../components/TitleBar'


export default function() {
  const panes = [
    { menuItem: 'login', render: () => <Tab.Pane>login exists here</Tab.Pane> },
    { menuItem: 'sign up', render: () => <Tab.Pane>sign up exists here</Tab.Pane> },
  ]
  return <>
    <TitleBar route='/auth/'/>
    <Container style={{ marginTop: 30 }}>
      <Grid textAlign='center' verticalAlign='middle'>
        <Grid.Column style={{ maxWidth: 450 }}>
          <Tab panes={panes}/>
        </Grid.Column>
      </Grid>
    </Container>
  </>
}