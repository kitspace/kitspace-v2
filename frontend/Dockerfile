FROM node:16-alpine AS base
WORKDIR /app

FROM base AS git-installed
## `git` is needed to install `1-click-bom-minimal` in `package.json`.
RUN apk --no-cache add git

# The build stage installs the development dependencies, runs the build and
# then moves to another folder to install the production/non-dev dependencies.
# The build folder (.next) and the production dependencies (/deps/node_modules)
# are copied during the next stage resulting in a more minimal image.
FROM git-installed AS build
WORKDIR /build
COPY . .
ENV NODE_ENV=development
RUN yarn --frozen-lockfile
ENV NODE_ENV=production
RUN yarn build
WORKDIR /deps
COPY package.json .
COPY yarn.lock .
RUN yarn --frozen-lockfile

FROM base AS production
COPY --chown=node:node --from=build /build/.next/ .next/
COPY --chown=node:node --from=build /deps/node_modules/ node_modules/
COPY --chown=node:node package.json .
COPY --chown=node:node next.config.js .
COPY --chown=node:node public/ public/
RUN mkdir src/ &&  chown -R node src
COPY --chown=node:node src/server.js src/server.js
ENV NODE_ENV=productionu
USER node

CMD ["node", "src/server.js"]
