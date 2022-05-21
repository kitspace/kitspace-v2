FROM postgres:14

COPY ./init_db.sh   /docker-entrypoint-initdb.d/10-init_db.sh
COPY ./postgresql.conf /etc/postgresql/postgresql.conf
