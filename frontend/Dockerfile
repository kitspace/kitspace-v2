FROM node:10.16.0-alpine

ENV NODE_ENV=development

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn --prune-lockfile

COPY . .

RUN yarn build

CMD ["yarn", "dev"]
