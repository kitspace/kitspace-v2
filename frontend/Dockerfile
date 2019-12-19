FROM node:10.16.0

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

CMD [ "yarn", "run", "dev" ]
