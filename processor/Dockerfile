FROM ubuntu:18.04

ENV DEBIAN_FRONTEND noninteractive
ENV NODE_ENV=development

RUN apt-get update && apt-get install -y software-properties-common curl
RUN add-apt-repository -y ppa:kicad/kicad-5.1-releases
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install -y \
    kicad \
    inkscape \
    imagemagick \
    nodejs \
    yarn \
    git

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

CMD ["yarn", "dev"]
