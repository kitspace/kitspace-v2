FROM node:16-alpine

# `git` is needed in the container to install `1-click-bom-minimal` in `package.json`.
RUN apk --no-cache add git

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./

ENV NODE_ENV=production
RUN yarn --frozen-lockfile
COPY . .
RUN yarn build


CMD sh -c "yarn start"
