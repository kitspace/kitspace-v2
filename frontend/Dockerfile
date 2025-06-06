FROM node:22-alpine AS base
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
RUN yarn run download-geoip
ENV NODE_ENV=production
RUN yarn build
WORKDIR /deps
COPY package.json .
COPY yarn.lock .
RUN yarn --frozen-lockfile

FROM base AS production

ENV NODE_ENV=production
# give the node user read and execute permissions
ARG PERMISSION=755
COPY --chmod=${PERMISSION} --from=build /deps/node_modules/ node_modules/
COPY --chmod=${PERMISSION} package.json .
COPY --chmod=${PERMISSION} next.config.ts .
COPY --chmod=${PERMISSION} public/ public/
COPY --chmod=${PERMISSION} --from=build /build/src/pages/api/geoip/GeoLite2-Country.mmdb /build/src/pages/api/geoip/GeoLite2-Country.mmdb

# The `.next` directory is used by `next/image` to cache optimized images.
# So it needs to be owned by the `node` user.
COPY --chown=node:node --from=build /build/.next/ .next/

USER node

CMD ["npm" , "run", "start"]
