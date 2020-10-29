import React from 'react'
import { string, number } from 'prop-types'

import { Button, Grid, Image, Segment } from 'semantic-ui-react'


const ProductImage = ({ src }) => {
  return <Image src={src} fluid />
}

const Product = ({ name, img_uri, price, description, projectLink }) => {
  return (
    <Segment style={{ border: 'none', boxShadow: 'none' }}>
      <Grid columns={2}>
        <Grid.Column style={{ borderRight: 'solid #B0BAA3 1px' }}>
          <ProductImage src={img_uri} />
        </Grid.Column>
        <Grid.Column style={{paddingLeft: '3rem'}}>
          <h2 style={{ textTransform: 'capitalize' }}>{name}</h2>
          <p>{price}</p>
          <p>{description}</p>
          <p>
            See complete project details{' '}
            <a href={projectLink} target="_blank">
              here.
            </a>
          </p>
          <Button />
        </Grid.Column>
      </Grid>
    </Segment>
  )
}

Product.propTypes = {
  name: string,
  img_uri: string,
  price: number,
  description: string,
  projectLink: string,
}

export default Product
