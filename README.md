# Kitspace Using a Gitea Backend

_work in progress_

[![Docker workflow status badge](https://github.com/kitspace/kitspace-v2/actions/workflows/docker.yml/badge.svg?branch=master)](https://github.com/kitspace/kitspace-v2/actions/workflows/docker.yml?query=branch%3Amaster)
[![kitspace-v2](https://img.shields.io/endpoint?url=https://dashboard.cypress.io/badge/simple/d8hk55&style=flat&logo=cypress)](https://dashboard.cypress.io/projects/d8hk55/runs)

Re-writing [Kitspace](https://github.com/kitspace/kitspace) to use [Gitea](https://github.com/go-gitea/gitea) as a Git and authentication service.

## Goals

Allow people to:

1. Add projects without knowing Git/Github
2. Still import/sync external Git repositories
3. Edit/make improvements and propose these changes to project creators

## Adding your project

### kitspace.yaml format

Currently the `kitspace.yaml` makes use of the following fields:

```yaml
summary: A description for your project

site: https://example.com # A site you would like to link to (include http:// or https://)

# The solder resist color of the preview rendering. 
color: purple 
  # If omitted "green" is used. Can be one of:
  # - green
  # - red
  # - blue
  # - black
  # - white
  # - orange
  # - purple
  # - yellow

# A path to your 1-click-bom in case it isn't `1-click-bom.tsv`. 
bom: my-bom.xlsx
  # Supported extensions are:
  # - .tsv
  # - .csv
  # - .ods
  # - .xlsx
  # Check out https://github.com/kitspace/1clickBOM#readme for more details

# A path to your folder of gerbers in case it isn't `gerbers/`.
gerbers: my/gerber/folder 

eda:
  type: kicad # or eagle
  pcb: path/to/your/file.kicad_pcb # your/eagle.brd

# A path to your README file in case it isn't in the repository root directory.
readme: my/special/readme.md 

pcb-services:
  [aisler, pcbway, oshpark, jlcpcb]
  # A list of the PCB services you would like to have included on your
  # page. If left undefined all are included. Otherwise ust be a list of Kitspace
  # sponsors, possible values are:
  #      - aisler
  #      - pcbway
  #      - oshpark
  #      - jlcpcb

# Disable InteractiveHtmlBom generation, enabled by default. (https://github.com/openscopeproject/InteractiveHtmlBom) 
ibom-enabled: false 

# Identifier field only used if the repository contains multiple projects. See below for details.
multi: 
```

Paths should be in UNIX style (i.e. use `/` not `\`) and relative to the root
of your repository. The YAML format is pretty straight forward but if you need
to know more check the example below and [the YAML website][6]. Use [this YAML
validator][yamllint] to be extra sure that your `kitspace.yaml` is valid.

### KiCad PCB

If you you used KiCad for your design you can also specify a KiCad PCB file to use by adding an `eda` field.

```yaml
eda:
  type: kicad
  pcb: path/to/your/file.kicad_pcb
```

If your project has a KiCad PCB or Eagle, an interactive assembly guide for the board will be created using the [Interactive HTML BOM plugin](https://github.com/openscopeproject/InteractiveHtmlBom) from the [Open Scope Project](https://github.com/openscopeproject).

If both `eda` and `gerbers` are present the Gerber files will be used directly everywhere except for the Interactive HTML BOM. 

### Some examples

Check out the repo links of the projects listed on
[kitspace.org](https://kitspace.org) already. The minimum required file tree is
something like:

```
.
├── 1-click-bom.tsv
└── gerbers
    ├── example.cmp
    ├── example.drd
    ├── example.dri
    ├── example.gko
    ├── example.gpi
    ├── example.gto
    ├── example.plc
    ├── example.sol
    ├── example.stc
    └── example.sts
```

A more advanced example could be something like:

```
.
├── kitspace.yaml
└── manufacture
    ├── advanced-example-BOM.tsv
    └── gerbers-and-drills
        ├── advanced-example-B_Adhes.gba
        ├── advanced-example-B_CrtYd.gbr
        ├── advanced-example-B_Cu.gbl
        ├── advanced-example-B_Fab.gbr
        ├── advanced-example-B_Mask.gbs
        ├── advanced-example-B_Paste.gbp
        ├── advanced-example-B_SilkS.gbo
        ├── advanced-example.drl
        ├── advanced-example-Edge_Cuts.gbr
        ├── advanced-example-F_Adhes.gta
        ├── advanced-example-F_CrtYd.gbr
        ├── advanced-example-F_Cu.gtl
        ├── advanced-example-F_Fab.gbr
        ├── advanced-example-F_Mask.gts
        ├── advanced-example-F_Paste.gtp
        └── advanced-example-F_SilkS.gto
```

with `kitspace.yaml` containing:

```yaml
summary: A more advanced example
site: https://example.com
color: red
bom: manufacture/advanced-example-BOM.tsv
gerbers: manufacture/gerbers-and-drills
```

#### The multi field

Kitspace supports multiple projects in one repository with the `multi` field. When multiple projects exist, `multi` will always be the first field in the `kitspace.yaml`, with the paths to your projects folder nested underneath.

```
├── kitspace.yaml
├── project_one
│   ├── 1-click-bom.tsv
│   ├── README.md
│   └── gerbers
│       ├── example.cmp
│       ├── example.drd
│       ├── example.dri
│        ...
│       ├── example.stc
│       └── example.sts
└── project_two
    ├── 1-click-bom.tsv
    ├── README.md
    └── gerbers
        ├── example.cmp
        ├── example.drd
        ├── example.dri
         ...
        ├── example.stc
        └── example.sts

```

with `kitspace.yaml` containing:

```yaml
multi:
  project_one:
    summary: First project in a repository.
    color: blue
    site: https://example-one.com
  project_two:
    summary: Second project in a repository.
    color: red
    site: https://example-two.com
```

If you want to use custom paths for the `readme`, `bom`, or `gerbers` then note that these are from the root of the repository.

E.g.

```
├── kitspace.yaml
├── manufacturing_outputs
│   └── project_one_gerbers
│       ├── example.cmp
│       ├── example.drd
│       ├── example.dri
│        ...
│       ├── example.stc
│       └── example.sts
├── project_one
│   ├── documentation
│   │   └── README.md
    └── BOM.csv
└── project_two
    ...
```

```yaml
multi:
  project_one:
    readme: project_one/documentation/README.md
    bom: project_one/BOM.csv
    gerbers: manufacturing_outputs/project_one_gerbers
  project_two: ...
```

### Terms and conditions for adding a project

1. We (Kitspace developers) do not claim any ownership over your work, it remains yours.
2. By submitting your project you give us permission to host copies of your files for other people to download.
3. If you change your mind, you can remove your project any time by removing the project.

## Development

### Set Up

0. Get all the source code

```
git clone https://github.com/kitspace/kitspace-v2
cd kitspace-v2
git submodule update --init
```

1. Install [Docker](https://www.docker.com/get-started) and [docker-compose](https://pypi.org/project/docker-compose/) (on Ubuntu: `snap install docker` and `apt install docker-compose`)
2. Add the required lines to `/etc/hosts` (If you are not using Linux this probably won't work, please open an issue and we'll figure out how to support non-Linux development).

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

Open pull requests from trusted contributors that are not drafts get automatically merged into the `review` branch (reset to `master` before these auto-merges) and deployed to:

- [review.staging.kitspace.dev](https://review.staging.kitspace.dev)

We also auto deploy some development branches:

- [abdo-dev.staging.kitspace.dev](https://abdo-dev.staging.kitspace.dev) (from [abdo-dev](https://github.com/kitspace/kitspace-v2/tree/abdo-dev), [@AbdulrhmnGhanem](https://github.com/AbdulrhmnGhanem)'s branch)
- [kaspar-dev.staging.kitspace.dev](https://abdo-dev.staging.kitspace.dev) (from [kaspar-dev](https://github.com/kitspace/kitspace-v2/tree/kaspar-dev), [@kasbah](https://github.com/kasbah)'s branch)

## Ansible

We configure our staging servers using [Ansible](https://docs.ansible.com/ansible/latest/index.html). Our playbooks and roles are in the [ansible](ansible/) directory.

## Running Integration Tests

1. Make sure the frontend is being served at [http://kitspace.test:3000](http://kitspace.test:3000); by following the "Set Up" steps. You can use one of the following options.

### Run the tests in a docker container

```console
docker-compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.e2e.yml up e2e
```

### Without docker

```console
cd e2e
yarn
yarn e2e
```

### GUI

```console
cd e2e
yarn
yarn gui
```

### Recording new visual tests:

1. Make sure you have Chrome installed on your machine.
2. Write the test in `cypress/integration/newTest.visual.spec.js`, See [IBOM.visual.spec.js](https://github.com/kitspace/kitspace-v2/blob/master/e2e/cypress/integration/IBOM.visual.spec.js) .
3. Run `./scripts/record_visual_spec.sh cypress/integration/newTest.visual.spec.js`.
