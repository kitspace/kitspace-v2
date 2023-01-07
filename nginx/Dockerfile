FROM nginx:1.23-alpine
RUN apk add inotify-tools certbot openssl bash certbot-nginx curl
# Install sentry-cli
RUN curl -sL https://sentry.io/get-cli/ | bash

WORKDIR /usr/local/bin
COPY reachability_healthcheck ./
RUN chmod +x reachability_healthcheck

WORKDIR /opt
COPY nginx.conf /etc/nginx/
COPY kitspace.template ./
COPY kitspace-minio.test.conf ./
COPY command ./
CMD ["./command"]
