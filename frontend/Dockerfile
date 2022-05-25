FROM node:16-alpine AS base
## `git` is needed in the container to install `1-click-bom-minimal` in `package.json`.
RUN apk --no-cache add git
WORKDIR /app

FROM base AS build
WORKDIR /build
COPY . .
ENV NODE_ENV=development
RUN yarn --frozen-lockfile
ENV NODE_ENV=production
RUN yarn build

FROM base AS dependencies
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
