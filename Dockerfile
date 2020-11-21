FROM node:12-buster
WORKDIR /project

RUN apt-get update && apt-get install -y \
  git \
  cmake \
  lame \
  ffmpeg \
  libmagic-dev \
  libatlas-base-dev

# lame / ffmpeg are required for audio conversion algorithms
# libmagic-dev and libatlas-base-dev are required to build snowboy

COPY ./ src/
WORKDIR src
RUN pwd
RUN ls

RUN npm install -g typescript
RUN npm install -g ts-node
RUN npm install --unsafe-perm

# Start the bot by running `node -r ts-node/register ./src/main.ts`