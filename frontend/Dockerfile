FROM node:10.16.0-alpine

ENV NODE_ENV=development

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .
