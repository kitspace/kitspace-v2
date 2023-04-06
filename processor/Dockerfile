FROM ubuntu:22.04

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get install -qq -y software-properties-common curl
RUN add-apt-repository -y ppa:kicad/kicad-7.0-releases
RUN curl -sL https://deb.nodesource.com/setup_16.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get update -qq && apt-get install -qq --no-install-recommends -y \
    kicad \
    inkscape \
    imagemagick \
    nodejs \
    yarn \
    python3-pip \
    git

WORKDIR /app
COPY . .
RUN pip3 install -r requirements.txt
RUN npm install --global yarn
RUN yarn install
RUN yarn tsc
RUN yarn cp-assets

RUN addgroup --gid 1000 node && \
    adduser -u 1000 --gid 1000 node --shell /bin/bash --home /home/node && \
    mkdir /data /gitea-data && \
    chown -R node /data /gitea-data

USER node
CMD ["node", "dist/src/main.js"]
