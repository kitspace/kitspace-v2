FROM nginx:1.17-alpine
RUN apk add inotify-tools certbot openssl bash certbot-nginx
WORKDIR /opt
COPY nginx.conf /etc/nginx/
COPY kitspace.template ./
COPY command ./
CMD ["./command"]
