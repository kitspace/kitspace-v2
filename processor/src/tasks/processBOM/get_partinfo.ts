import superagent from 'superagent'
import * as ramda from 'ramda'

const partinfoURL = 'https://partinfo.kitspace.org/graphql'

const MpnQuery = `
query MpnQuery($mpn: MpnInput!) {
  part(mpn: $mpn) {
    mpn {
      manufacturer
      part
    }
    datasheet
    description
    image {
      url
      credit_string
      credit_url
    }
    specs {
      key
      name
      value
    }
  }
}`

function post(mpn) {
  return superagent
    .post(partinfoURL)
    .set('Accept', 'application/json')
    .send({
      query: MpnQuery,
      variables: {
        mpn,
      },
    })
    .timeout(60000)
    .then(res => res.body.data.part)
}

export default function getPartinfo(lines) {
  const requests = lines.map(line => Promise.all(line.partNumbers.map(post)))
  return Promise.all(requests).then(ramda.flatten)
}
