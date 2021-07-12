FROM ubuntu:20.04

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get install -qq -y software-properties-common curl
RUN add-apt-repository -y ppa:kicad/kicad-5.1-releases
RUN curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update -qq && apt-get install -qq --no-install-recommends -y \
    kicad \
    kicad-symbols \
    inkscape \
    imagemagick \
    nodejs \
    yarn \
    python3-pip \
    xdotool \
    xvfb \
    git

RUN mkdir /app
WORKDIR /app

COPY . .

RUN pip3 install -r requirements.txt
RUN yarn install

CMD ["yarn", "start"]
