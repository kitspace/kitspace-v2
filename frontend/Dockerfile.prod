FROM node:14-alpine

ENV NODE_ENV=production

# `git` is needed in the container to install `1-click-bom-minimal` in `package.json`.
RUN apk --no-cache add git

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn --prune-lockfile

COPY . .

CMD sh -c "yarn build && yarn start"
