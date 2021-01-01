FROM ubuntu:20.04

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get install -y software-properties-common curl
RUN add-apt-repository -y ppa:kicad/kicad-5.1-releases
RUN curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install --no-install-recommends -y \
    kicad \
    inkscape \
    imagemagick \
    nodejs \
    yarn \
    xvfb \
    git

RUN mkdir /app
WORKDIR /app

COPY . .

RUN yarn install

CMD ["yarn", "start"]
