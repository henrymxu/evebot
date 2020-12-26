# E.V.E Bot

![E.V.E](https://ih1.redbubble.net/image.646644893.4779/st,small,507x507-pad,600x600,f8f8f8.u1.jpg)

E.V.E is a voice enabled all in one discord bot.  Feel free to host your own instance!

If you are a developer and wish to contribute / customize E.V.E, check out the [wiki](https://github.com/henrymxu/evebot/wiki)!

## Table of Contents

- [Features](#features)
- [Usage](#usage)
- [Installation](#installation)
- [Configurations](#configurations)
- [Troubleshooting](#troubleshooting)
- [Support](#support)
- [License](#license)

## Features

- Play music!
- Start a custom radio!
- Clip or recite voice channel activity!
- Say anything you want with the bot!
- And much more!

## Usage

1. Add the bot to your Discord Server
    - Once the bot has been started (see [here](#installation)), add it through the [Discord Developer Portal](https://discord.com/developers/docs/intro)
2. Use the `?help` command to see the various command groups
    - Use the `?help` command with a command name or group to see the command details (e.g `?help play`)
3. Say one of the provided hotwords to start a voice command (Alexa, Hey Siri, and OK Google)
    - Wait for the chime to start saying your command
    - Don't worry about other people interrupting you

## Installation

The installation process for E.V.E is quite long due to all the different services it requires.

These steps are if you wish to run the bot on your local machine (i.e. PC, laptop).
E.V.E runs on macOS and Linux (Windows has not been tested).

#### Pre Installation
1. Retrieve all the required / desired tokens
2. Install the following external dependencies
    - ffmpeg
    - lame (pre-installed on macOS)
    - node / npm (`node >=12.0.0`)

#### Installation from NPM
1. Install the package (`npm install evebot`)
2. TODO: setup way to configure env variables / etc when starting program

#### Installation From Source
1. Clone / Download the git repository (`git clone git@github.com:henrymxu/evebot.git`)
2. Set up the environment variables and api tokens
    - If you know how to set up environment variables you can do that
    - If not, you can set up a `keys.json` file in the `evebot` directory with the key value pairs
3. Inside a terminal, navigate to the newly cloned `evebot` directory
4. Install TypeScript (`npm install -g typescript`) and ts-node (`npm install -g ts-node`)
5. Install the dependencies using `npm install`
6. Start the bot using `node -r ts-node/register ./src/main.ts`

#### Local Installation with Docker

// TODO

#### Heroku Deployment

// TODO

### Environment Variables

| Name                                                                       | Environment Variable | Description                                                                                    | Required |
|----------------------------------------------------------------------------|----------------------|------------------------------------------------------------------------------------------------|----------|
| Bot Environment                                                            | bot_environment      | Informs the bot to use either 'development' or 'production' settings. Defaults to development. | ✗        |
| [Youtube Cookie](https://github.com/fent/node-ytdl-core/issues/635)        | youtube_cookie       | Required for the bot to bypass Youtube 429 Errors (Too many requests).                         | ✗        |

### General API Tokens

| Name                                                                       | Environment Variable | Description                                                                                    | Required |
|----------------------------------------------------------------------------|----------------------|------------------------------------------------------------------------------------------------|----------|
| [Discord Bot Token](https://discord.com/developers/applications)           | discord_token        | Required for the bot to login and communicate with discord.                                    | ✓        |
| [Youtube Search API Token](https://developers.google.com/youtube/v3)       | youtube_api_token    | Required for the bot to search for song URLs  (Hopefully this will be converted to a scraper). | ✓        |
| [Genius API Token](https://docs.genius.com/)                               | genius_token         | Required for the bot to find lyrics of songs.                                                  | ✗        |
| [Spotify API Tokens](https://developer.spotify.com/documentation/web-api/) | spotify_id           | Required for the bot to create radio playlists, search albums and playlists.                   | ✗        |
|                                                                            | spotify_secret       |                                                                                                | ✗        |

### Platform API Tokens

Details on how to authenticate and configure each provider can be found in each of their individual sections.

#### Summary

| Name                                        | Speech-to-Text                                                                     | Text-to-Speech                                                                     | Cloud Storage                                                    |
|---------------------------------------------|------------------------------------------------------------------------------------|------------------------------------------------------------------------------------|------------------------------------------------------------|
| [IBM Watson](#ibm-watson)                   | [✓](https://www.ibm.com/cloud/watson-speech-to-text)                               | [✓](https://www.ibm.com/cloud/watson-text-to-speech)                               | ✗                                                          |
| [Microsoft Azure](#microsoft-azure)         | [✓](https://azure.microsoft.com/en-us/services/cognitive-services/speech-to-text/) | [✓](https://azure.microsoft.com/en-us/services/cognitive-services/text-to-speech/) | ✗                                                          |
| [Google Cloud](#google-cloud)               | [✓](https://cloud.google.com/speech-to-text)                                       | [✓](https://cloud.google.com/text-to-speech)                                       | ✗                                                          |
| [Amazon Web Services](#amazon-web-services) | ✗                                                                                  | ✗                                                                                  | [✓](https://aws.amazon.com/dynamodb/?nc2=h_ql_prod_db_ddb)                                                                                      |

#### IBM Watson

| Environment Variable | Description |
|----------------------|-------------|
| watson_token         | API Key     |
| watson_url           | URL         |

#### Microsoft Azure

| Environment Variable | Description           |
|----------------------|-----------------------|
| microsoft_token      | KEY                   |
| microsoft_location   | LOCATION (e.g eastus) |

#### Google Cloud

| Environment Variable | Description                                        |
|----------------------|----------------------------------------------------|
| google_keyFileCred   | Contents of the Google Cloud JSON Credentials File |

#### Amazon Web Services

| Environment Variable  | Description       |
|-----------------------|-------------------|
| AWS_REGION            | AWS Region        |
| AWS_ENDPOINT          | Endpoint          |
| AWS_ACCESS_KEY_ID     | Access Key ID     |
| AWS_SECRET_ACCESS_KEY | Secret Access Key |

## Configurations

## Troubleshooting

- The bot doesn't seem to recognize your voice commands
    - Wait until you hear the chime from the bot after saying the hotword to begin your voice command
    - Make sure the voice command doesn't get cut off by the ending chime

- The bot seems to be unresponsive or not listening to any hotwords
    - Try using the `rejoin` command
    
- The bot is unable to find any songs to play
    - Try adding / updating the [`youtube_cookie`](#environment-variables) to the bot

## Support

- Feel free to create an issue on GitHub if there are any problems installing or using E.V.E!

## License

This repository is licensed under Apache 2.0.  You may host an instance of this bot for non-commercial and personal use free of charge.
