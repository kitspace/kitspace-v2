export const uploadFileToGiteaServer = async (repo, file, csrf) => {

  const formData = new FormData()
  const blobFromFile = new Blob([file], {type: 'text/plain'})
  formData.append('file', blobFromFile)

  return new Promise((resolve, reject) => {
    const endpoint = `${process.env.KITSPACE_GITEA_URL}/${repo}/upload-file?_csrf=${csrf}`
    const req = new XMLHttpRequest()
    req.withCredentials = true
    req.open('POST', endpoint)
    req.onload = () => {
      if(req.status >= 200 && req.status < 300) {
        console.log(req.response)
        resolve(JSON.parse(req.response))
      } else {
        reject({
          status: req.status,
          statusText: req.statusText,
        })
      }
    }

    req.onerror = () => {
      reject({
        status: req.status,
        statusText: req.statusText,
      })
    }

    req.send(formData)
  })
}
