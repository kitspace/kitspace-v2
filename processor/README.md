# Kitspace v2 Asset Processor

This is a NodeJS and [Express](https://expressjs.com/) server that processes Kitspace specific assets such as printed circuit board files and bill of materials.

## Protocol

### GET `/files/[user]/[project]/[git-ref]/[file]`

responds with:
- `202` - Asset processing for this file is in progress
    - content: nothing
- `200` - Asset processing completed successfully
    - content: the file
- `424` - Asset processing for this file failed
    - content: text of the error message
- `404` - Asset processing was never attempted -- this file doesn't exist
    - content: nothing


### GET `/status/[user]/[project]/[git-ref]/[file]`

responds with:
- `200`
    - content: JSON
```
{
  status: "in_progress" | "done" | "failed"
  error?: string
}
```
e.g.

```
{
    "status": "failed",
    "error": "Unknown error"
}
```

or

```
{
    "status": "done"
}
```

- `404` - Asset processing was never attempted -- this file doesn't exist
    - content: nothing

### Parameters

- `user` the project owner - case insensitive
- `project` the project name - case insenstive
- `git-ref` A full-length git sha-1 or `HEAD` (will be re-directed to the latest commit), currently we only support querying the latest commit. - case sensitive
- `file` (case sensitive) one of:
    - for single projects:
        - `gerber-info.json`
        - `${projectName}-${short-hash}-gerbers.zip` (filename can be obtained from gerber-info.json)
        - `images/bottom.svg`
        - `images/top.svg`
        - `images/top.png`
        - `images/top-large.png`
        - `images/top-meta.png`
        - `images/top-with-background.png`
        - `images/layout.svg`
        - `1-click-BOM.tsv`
        - `bom-info.json`
        - `interactive_bom.json`
        - `kitspace-yaml.json`
        - `readme.html`
    - for multi projects:
        - as above but prefixed with the multi-project name i.e. `[user]/[project]/[git-ref]/[multi-project-name]/zip-info.json` etc.
        - except for `kitspace-yaml.json` which is still `[user]/[project]/[git-ref]/kitspace-yaml.json`

### Processing of remote files through API

#### POST `/process-file`

- Multi-part form data with an input name of "upload" and a filename that ends with `.kicad_pcb`
- Must include a header `Authorization` with contents `Bearer ${KITSPACE_PROCESSOR_REMOTE_API_TOKEN}`

Responds with:
```
{
    "id": string
}
```

Where `id` is a md5 sum of the uploaded file.

#### GET `/processed/status/[id]/[file]

Responds like "GET `/status/[user]/[project]/[git-ref]/[file]`" above.

#### GET `/processed/files/[id]/images/layout.svg`

Responds like "GET `/files/[user]/[project]/[git-ref]/[file]`" above.

#### Supported files on remote API

The remote API only supports:

- `images/layout.svg`

## Development

###  Adding dependencies

Changing dependencies requires you to restart the development container.

```
cd processor
yarn add <new dependency>
cd ..
docker-compose restart processor
```

