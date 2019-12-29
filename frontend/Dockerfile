FROM node:10.16.0

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./
RUN NODE_ENV=production yarn install

CMD [ "/bin/bash", "-c", "yarn install && yarn build && yarn run dev" ]
