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
- `project` the project name - case insensitve
- `git-ref` A full-length git sha-1 or `HEAD` (will be re-directed to the latest commit), currently we only support querying the latest commit. - case sensitive
- `file` (case sensitive) one of:
    - for single projects:
        - `zip-info.json`
        - `${projectName}-${short-hash}-gerbers.zip` (filename can be obtained from zip-info.json)
        - `images/bottom.svg`
        - `images/top.svg`
        - `images/top.png`
        - `images/top-large.png`
        - `images/top-meta.png`
        - `images/top-with-background.png`
        - `1-click-BOM.tsv`
        - `info.json`
        - `interactive_bom.json`
    - for multi projects:
        - as above but prefixed with the multi-project name i.e. `[user]/[project]/[git-ref]/[multi-project-name]/zip-info.json` etc.



## Development

###  Adding dependencies

Changing dependencies requires you to restart the development container.

```
cd processor
yarn add <new dependency>
cd ..
docker-compose restart processor
```

