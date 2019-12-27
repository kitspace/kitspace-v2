FROM node:10.16.0

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./

CMD [ "/bin/bash", "-c", "yarn install && yarn build && yarn run dev" ]
