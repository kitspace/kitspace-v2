#!/usr/bin/env bash

# This script depends on `httpie`, install it from here `https://httpie.io/docs#linux`.

set -Eeuo pipefail

docker-compose -f docker-compose.deploy.yml up &

# Look(retry every 20s) in the logs for sign that gitea is ready
until docker logs kitspace_gitea_1 | grep 'Preparing to run install page' ; do sleep 20s; done

sleep 10s

# Make a GET request to installation page, as if visiting '/index'
http --session=/tmp/session.json --headers gitea.kitspace.test:3000

http --session=/tmp/session.json --form --headers --check-status --ignore-stdin gitea.kitspace.test:3000 db_type='PostgreSQL' \
	db_host='postgres:5432' \
	db_user='gitea' \
	db_passwd='change_me' \
	db_name='gitea' \
	ssl_mode='disable' \
	charset='utf8' \
	db_path='/data/gitea/gitea.db' \
	app_name='Gitea: Git with a cup of tea' \
	repo_root_path='/data/git/repositories' \
	lfs_root_path='/data/git/lfs' \
	run_user='git' \
	domain='gitea.kitspace.test' \
	ssh_port='22' \
	http_port='3000' \
	app_url='http://gitea.kitspace.test:3000/' \
	log_root_path='/data/gitea/log' \
	enable_federated_avatar='on' \
	admin_name='__admin' \
	admin_passwd='123456' \
	admin_confirm_passwd='123456' \
	admin_email='admin@kitspace.com'

	sleep 5s && docker-compose kill
