FROM node:16-alpine AS base
## `git` is needed in the container to install `1-click-bom-minimal` in `package.json`.
RUN apk add git
WORKDIR /app

FROM base AS build
WORKDIR /build
COPY . .
RUN yarn --frozen-lockfile
ENV NODE_ENV=production
RUN yarn build
RUN rm -rf node_modules

FROM base AS production
COPY --from=build /build/.next /app/.next
COPY package.json .
COPY yarn.lock .
COPY next.config.js .
RUN mkdir src/
COPY src/server.js src/server.js
RUN yarn --frozen-lockfile --production
CMD yarn start
