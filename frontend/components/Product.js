import React from 'react'
import { Button, Divider, Grid, Image, Segment } from 'semantic-ui-react'


const Product = ({name, img_uri, price, description}) => {
  return <Segment>
    <Grid columns={2}>
      <Grid.Column>
        <Image  src={img_uri} fluid/>
      </Grid.Column>
      <Grid.Column>
        <h2>{name}</h2>
        <p>{price}</p>
        <p>{description}</p>
        <Button />
      </Grid.Column>
    </Grid>
    <Divider vertical />
  </Segment>
}

export default Product