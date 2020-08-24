# Kitspace Using a Gitea Backend

_work in progress_

Re-writing [Kitspace](https://github.com/kitspace/kitspace) to use [Gitea](https://github.com/go-gitea/gitea) as a Git and authentication service.

## Goals
Allow people to:
1. Add projects without knowing Git/Github
2. Still import/sync external Git repositories
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

4. Build and run the Gitea docker container
```
docker-compose up gitea
```

5. Go to [localhost:3333/install](http://localhost:3333/install) and complete the install (everything should already be filled in correctly, just press the button at the bottom). 

6. Create a new user on [localhost:3333/user/sign_up](http://localhost:3333/user/sign_up), this will be the admin user


7. Build and bring up the frontend 

```
docker-compose up frontend
```

8. Bring up the rest of the containers (in the future this command is all you need to do to bring up everything, including gitea and the frontend)

```
docker-compose up
```

9. Making edits on the code in `frontend/` should auto compile and hot-reload at [kitspace.test:3000](http://kitspace.test:3000).
