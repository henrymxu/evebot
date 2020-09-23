FROM node:12-buster
WORKDIR /project

RUN apt-get update && apt-get install -y \
  git \
  cmake \
  lame \
  libasound-dev \
  ffmpeg \
  libmagic-dev \
  libatlas-base-dev

# lame / ffmpeg are required for audio conversion algorithms
# libmagic-dev and libatlas-base-dev are required to build snowboy
# libasound-dev??

COPY ./ src/
WORKDIR src
RUN pwd
RUN ls

RUN npm install typescript -g
RUN npm install --unsafe-perm
RUN tsc