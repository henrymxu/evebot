FROM node:12-buster
WORKDIR /project

RUN apt-get update && apt-get install -y \
  lame \
  ffmpeg

# lame / ffmpeg are required for audio conversion algorithms

COPY ./ src/
WORKDIR src
RUN pwd
RUN ls

RUN npm install -g typescript
RUN npm install -g ts-node
RUN npm install --unsafe-perm

# Start the bot by running `node -r ts-node/register ./src/main.ts`
