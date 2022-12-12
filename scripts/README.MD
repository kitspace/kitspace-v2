# Importing projects
To import the boards run the `importBoardsTxt.ts` script
```console
$ ./scripts/importBoardsTxt.ts --help
Usage: importBoardsTxt [options]
    options:
      --giteaUrl: Gitea URL (default: http://localhost:3333)
      --adminToken: Gitea admin API token (classic)
      --githubToken: GitHub API token
      --numberOfRepos: Number of repositories to import (default: 1000)
      --help: Show this help
```
### To generate `adminToken` run `create_gitea_admin_token.sh`
```console
$ ./scripts/create_gitea_admin_token.sh
Usage: create_gitea_admin_token.sh <username> <password> <email>
```

## On staging servers
The `create_gitea_admin_token.sh` and `importBoardsTxt.ts` scripts can be executed from a remote machine (your local machine); to avoid leaking the credentials 👇

### To generate `adminToken` run `create_gitea_admin_token.sh`
```console
$ ssh <server> "bash -s" < ./scripts/create_gitea_admin_token.sh "someone" "very_strong_password_123" "someone@example.com"
New user 'someone' has been successfully created!
<admin token>
```

### To run the import script
```console
$ ssh <server> -t ./importBoardsTxt --githubToken $(gh auth token) --adminToken <admin token> 
Importing repos 100.00% ████████████████████ 1895.1s 141/141
```
