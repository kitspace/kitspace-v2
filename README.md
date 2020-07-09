# Kitspace Using a Gitea Backend

_work in progress_

Re-writing [Kitspace](https://github.com/kitspace/kitspace) to use [Gitea](https://github.com/go-gitea/gitea) as a Git and authentication service.

## Goals
Allow people to:
1. Add projects without knowing Git/Github
2. Stil import/sync external Git repositories
3. Edit/make improvements and propose these changes to project creators


## Development

### Set Up
0. Get all the source code
```
git clone https://github.com/kitspace/kitspace-using-gitea
cd kitspace-using-gitea
git submodule update --init
```

1. Install [Docker](https://www.docker.com/get-started) and [docker-compose](https://pypi.org/project/docker-compose/) (on Ubuntu: `snap install docker` and `apt install docker-compose`)
2. Add the following to `/etc/hosts` (or your platform's equivalent)

```
127.0.0.1	kitspace.test
127.0.0.1	gitea.kitspace.test
```

3. Copy the example .env

```
cp .env.example .env
```
4. Build and run the docker containers
```
docker-compose up
```

5. Go to [gitea.kitspace.test:3000/install](http://gitea.kitspace.test:3000/install) and complete the install (everything should already be filled in correctly). Create a new user and login.

6. Making edits on the code in `frontend/` should auto compile and hot-reload at [kitspace.test:3000](http://kitspace.test:3000).
