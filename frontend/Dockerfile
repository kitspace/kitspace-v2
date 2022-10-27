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

ENV NODE_ENV=production
# give the node user read-only permissions
ARG PERMISSION=644
COPY --chmod=${PERMISSION} --from=build /deps/node_modules/ node_modules/
COPY --chmod=${PERMISSION} package.json .
COPY --chmod=${PERMISSION} next.config.js .
COPY --chmod=${PERMISSION} public/ public/
COPY --chmod=${PERMISSION} src/server.js server.js

# The `.next` directory is used by `next/image` to cache optimized images.
# So it needs to be owned by the `node` user.
COPY --chown=node:node --from=build /build/.next/ .next/

USER node

CMD ["node", "server.js"]
