FROM node:16-alpine AS base
## `git` is needed in the container to install `1-click-bom-minimal` in `package.json`.
RUN apk add git
WORKDIR /app

FROM base AS build
WORKDIR /build
COPY . .
ENV NODE_ENV=development
RUN yarn --frozen-lockfile
RUN yarn build

FROM base AS production
COPY --from=build /build/.next /app/.next
COPY package.json .
COPY yarn.lock .
COPY next.config.js .
RUN mkdir src/
COPY src/server.js src/server.js
ENV NODE_ENV=production
RUN yarn --frozen-lockfile
CMD sh -c "yarn start"
