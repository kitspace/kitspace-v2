# Kitspace Using a Gitea Backend

_work in progress_

![Publish Docker images status badge](https://github.com/kitspace/kitspace-v2/workflows/Publish%20Docker%20images/badge.svg)


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
2. Add the required lines to `/etc/hosts`  (If you are not using Linux this probably won't work, please open an issue and we'll figure out how to support non-Linux development).

```
cat ./config/hosts | sudo tee -a /etc/hosts
```

3. Copy the example .env

```
cp .env.example .env
```
4. Build and run the docker containers
```
docker-compose up
```

5. Go to [gitea.kitspace.test:3000/user/sign_up](http://gitea.kitspace.test:3000/user/sign_up) and create a new user. This will be the admin user.


## Frontend

The frontend is a [NextJS](https://nextjs.org) server in the [frontend directory](frontend/). Making edits on the code should auto compile and reload at [kitspace.test:3000](http://kitspace.test:3000).

Changing dependencies requires you to restart the development container:

```
cd frontend
yarn add <new dependency>
cd ..
docker-compose restart frontend
```

## Gitea

This is built from a git submodule of [our fork of Gitea](https://github.com/kitspace/gitea).

When it first builds the docker container it builds the whole Gitea project (`make clean-all build`). When you restart the container it recompiles only the backend and doesn't recompile unchanged files (`make backend`).


## Processor

This is a NodeJS and [Express](https://expressjs.com/) server that processes all the assets. As with the frontend, changing dependencies requires you to restart the development container.


## Auto Deploys

This repo auto deploys the `master` branch (whether e2e tests pass or not) to our staging server.

- [master.staging.kitspace.dev](https://master.staging.kitspace.dev)

We also auto deploy some development branches:

- [abdo-dev.staging.kitspace.dev](https://abdo-dev.staging.kitspace.dev) (from [abdo-dev](https://github.com/kitspace/kitspace-v2/tree/abdo-dev), [@AbdulrhmnGhanem](https://github.com/AbdulrhmnGhanem)'s branch)
- [kaspar-dev.staging.kitspace.dev](https://abdo-dev.staging.kitspace.dev) (from [kaspar-dev](https://github.com/kitspace/kitspace-v2/tree/kaspar-dev), [@kasbah](https://github.com/kasbah)'s branch)

## Ansible

We configure our staging servers using [Ansible](https://docs.ansible.com/ansible/latest/index.html). Our playbooks and roles are in the [ansible](ansible/) directory.


## Running Integration Tests

1. Make sure the frontend is being served at [http://kitspace.test:3000](http://kitspace.test:3000); by following the `Set Up` steps.

2. Navigate to `e2e`: `cd e2e/`.

3. Install dependencies: `yarn install`.

4. Source the `.env` file: `set -a && source ../.env && set +a`

5. Start the testing client: `npx cypress open` or `node_modules/.bin/cypress` command.

6. The Cypress GUI should pop up.

7. To run all tests, press `Run all specs`.
