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

RUN mkdir /app
WORKDIR /app

COPY . .

RUN yarn install
RUN pip3 install -r requirements.txt

CMD ["yarn", "start"]
