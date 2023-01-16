# Importing projects
To import the boards run the `importBoardsTxt.ts` script
```console
$ ./scripts/importBoardsTxt.ts --help
Usage: importBoardsTxt [options]
    options:
      --giteaUrl: Gitea URL (default: http://localhost:3333)
      --adminToken: Gitea admin API token (default: generated automatically)
      --githubToken: GitHub API token (classic) (Embedded into the script in staging servers.)
      --numberOfRepos: Number of repositories to import (default: 1000)
      --tokenOnly: Only generate the admin token and exit.
      --help: Show this help
```
### To generate `adminToken` run `create_gitea_admin_token.sh`
This is useful if you want to run the script on a remote gitea instance (not localhost:3333)
```console
$ ./scripts/importBoardsTxt.ts --tokenOnly
2fe95bda36c002ee784e62482a7037f6766cf882

```

## On staging servers
### To run the import script
```console
$ ssh <server> -t ./importBoardsTxt 
Importing repos 100.00% ████████████████████ 1895.1s 141/141
```
