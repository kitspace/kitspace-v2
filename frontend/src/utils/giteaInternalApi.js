/*
 * Committing multiple files to gitea is a two steps process:
 *  1. Upload the files to gitea which it turn returns a UUID for that file
 *  2. UUID returned from the previous step is used to make the actual commit request.
 */

import { b64toBlob, readFileContent } from '@utils/index'

/**
 * Upload a file to gitea server, just upload it doesn't commit the files
 * @param repo{string}
 * @param file{object}
 * @param csrf{string}
 * @returns {Promise<Object>}
 */
const uploadFileToGiteaServer = async (repo, file, csrf) => {
  const fileContentBlob = await b64toBlob(await readFileContent(file))
  const blobFromFile = new Blob([fileContentBlob], { type: file.type })

  const formData = new FormData()
  formData.append('file', blobFromFile, file.name)

  return new Promise((resolve, reject) => {
    const endpoint = `${process.env.KITSPACE_GITEA_URL}/${repo}/upload-file?_csrf=${csrf}`
    const req = new XMLHttpRequest()
    req.withCredentials = true
    req.open('POST', endpoint)

    req.onload = () => {
      if (req.status >= 200 && req.status < 300) {
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

/**
 * upload multiple files to gitea server, just upload it doesn't commit the files
 * @param repo{string}
 * @param files{[]}
 * @param csrf{string}
 * @returns {Promise<string[]>}
 */
export const uploadFilesToGiteaServer = async (repo, files, csrf) => {
  const filesUUIDs = await Promise.all(
    files.map(async file => {
      return await uploadFileToGiteaServer(repo, file, csrf)
    }),
  )
  return filesUUIDs.map(res => res.uuid)
}

/**
 * Takes an array of files and commit it to Gitea server.
 * @param repo{string}
 * @param files{[]}
 * @param commitSummary{=string}
 * @param commitMessage{=string}
 * @param commitChoice{=string}
 * @param treePath{=string}
 * @param newBranchName{=string}
 * @param csrf{string}
 * @returns {Promise<boolean>}
 */
export const commitFiles = async ({
  repo,
  files,
  commitSummary,
  commitMessage,
  commitChoice,
  treePath,
  newBranchName,
  csrf,
}) => {
  const filesUUIDs = await uploadFilesToGiteaServer(repo, files, csrf)

  return commitFilesWithUUIDs({
    repo,
    filesUUIDs,
    commitSummary,
    commitMessage,
    commitChoice,
    treePath,
    newBranchName,
    csrf,
  })
}

/**
 * Take an array of UUIDs of files that have been uploaded to Gitea and commit it to Gitea server.
 * @param repo{string}
 * @param filesUUIDs{[string]}
 * @param commitSummary{=string}
 * @param commitMessage{=string}
 * @param commitChoice{=string}
 * @param treePath{=string}
 * @param newBranchName{=string}
 * @param csrf{string}
 * @returns {Promise<boolean>}
 */
export const commitFilesWithUUIDs = async ({
  repo,
  filesUUIDs,
  commitSummary = 'commit files',
  commitMessage = '',
  commitChoice = 'direct',
  treePath = '',
  newBranchName = 'patch-1',
  csrf,
}) => {
  const endpoint = `${process.env.KITSPACE_GITEA_URL}/${repo}/upload/master?_csrf=${csrf}`

  // The body of the request must be url encoded
  const body = new URLSearchParams({
    _csrf: csrf,
    tree_path: treePath,
    commit_summary: commitSummary,
    commit_message: commitMessage,
    commit_choice: commitChoice,
    new_branch_name: newBranchName,
  })

  // Files UUIDs aren't passed as an array; each file is passed as `&files={uuid}` in the request body
  filesUUIDs.forEach(uuid => {
    body.append('files', uuid)
  })

  const res = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body,
  })

  console.log(res)
  return res.ok
}
