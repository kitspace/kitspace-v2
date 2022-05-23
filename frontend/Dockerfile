FROM node:16-alpine

# `git` is needed in the container to install `1-click-bom-minimal` in `package.json`.
RUN apk --no-cache add git

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn --frozen-lockfile

COPY . .

CMD sh -c "yarn build && yarn start"
