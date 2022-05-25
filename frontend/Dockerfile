FROM node:16-alpine AS base
WORKDIR /app

FROM base AS git-installed
## `git` is needed in the container to install `1-click-bom-minimal` in `package.json`.
RUN apk --no-cache add git

FROM git-installed AS build
WORKDIR /build
COPY . .
ENV NODE_ENV=development
RUN yarn --frozen-lockfile
ENV NODE_ENV=production
RUN yarn build

FROM git-installed AS dependencies
WORKDIR /deps
COPY package.json .
COPY yarn.lock .
ENV NODE_ENV=production
RUN yarn --frozen-lockfile

FROM base AS production
COPY --from=build /build/.next .
COPY --from=dependencies /deps/node_modules .
COPY package.json .
COPY next.config.js .
COPY public .
RUN mkdir src/
COPY src/server.js src/server.js
ENV NODE_ENV=production
CMD yarn start
