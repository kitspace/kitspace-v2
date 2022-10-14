FROM ubuntu:20.04

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get install -qq -y software-properties-common curl
RUN add-apt-repository -y ppa:kicad/kicad-6.0-releases
RUN curl -sL https://deb.nodesource.com/setup_16.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
RUN add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
RUN apt-get update -qq && apt-get install -qq --no-install-recommends -y \
    kicad \
    inkscape \
    imagemagick \
    nodejs \
    yarn \
    docker-ce \
    python3-pip \
    git

WORKDIR /app
COPY . .
RUN pip3 install -r requirements.txt
RUN yarn install
RUN yarn tsc
RUN yarn cp-assets

RUN addgroup --gid 1000 node && \
    adduser -u 1000 --gid 1000 node --shell /bin/bash --home /home/node && \
    mkdir /data /gitea-data && \
    chown -R node /data /gitea-data && \
    git config --global user.name "processor" && \
    git config --global user.email "processor@kitspace.org"

USER node
CMD ["node", "dist/src/server.js"]
