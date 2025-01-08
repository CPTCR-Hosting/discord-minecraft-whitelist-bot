# Discord Bot for Minecraft Server Whitelisting (Pterodactyl)

Using this Discord bot, you allow users to add themselves and their friends to the whitelist of your Minecraft server hosted on Pterodactyl. Staff has full control over this whitelist system, making it secure and user-friendly.

## Features

- User-Friendly Commands: Easy-to-use commands for adding users to the whitelist.
- Friend Whitelisting: Allows users to add their friends to the whitelist.
- Pterodactyl Integration: Directly interacts with a Minecraft server hosted on Pterodactyl.
- Permission Control: Ensures only authorized users can manage the whitelist.
- Security: Validates Minecraft usernames to prevent invalid entries.

## Installation

Clone the Repository:

```
git clone https://github.com/CPTCR-Hosting/discord-minecraft-whitelist-bot.git
```

Install Dependencies:
Make sure you have [Node.js](https://nodejs.org/en) npm installed.

```
npm install
```

## Configure the Bot:

Rename `.env.example` to `.env`.

Fill in the following fields:

```
# https://discord.com/developers/applications/BOTID/bot
token= 
mongodb=

# https://panel.domain.com/account/api
apiKey=APIKEY 
# https://panel.domain.com/server/SERVERID
serverId="SERVERID" 
```

Run the Bot:

```
node src/index.js
```

## Commands
### Community
- `/whitelist add [user]` - Adds a user to the whitelist
- `/whitelist remove [user]` - Removes a user from the whitelist
- `/whitelist list` - Get a list of the current users in your whitelist

### Staff
- `/staff whitelist add [user]` - Adds a user to the whitelist
- `/staff whitelist remove [user]` - Removes a user from the whitelist (Also deletes it from a user's whitelist lists)
- `/staff whitelist view [@user]` - View a user's whitelist list
- `/staff lookup [user]` - Look up who whitelisted the enterd user


## Requirements

- A Discord bot token [Discord Developer Portal](https://discord.com/developers).
- Pterodactyl Minecraft server with API enabled. [Don't have a server?](#need-a-minecraft-server)
- JavaScript Knowledge
- Discord.js Knowledge

## Support Us

<p align="center">
  <a href="https://discord.gg/cptcr">
    <img src="https://img.shields.io/discord/1121353922355929129?label=Join%20Our%20Discord&logo=discord&style=flat-square" alt="Discord Server">
  </a>
  <a href="https://patreon.com/cptcr">
    <img src="https://img.shields.io/badge/Patreon-support-ff424d?style=flat-square&logo=patreon" alt="Support on Patreon">
  </a>
  <a href="https://github.com/cptcr">
    <img src="https://img.shields.io/github/followers/cptcr?label=Follow&style=social&logo=github" alt="GitHub">
  </a>
  <a href="https://buymeacoffee.com/cptcr">
    <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-donate-yellow?style=flat-square&logo=buy-me-a-coffee" alt="Buy Me a Coffee">
  </a>
</p>

# Need a Minecraft server?

Looking for a reliable Minecraft server? Check out [Our Hosting](https://cptcr.shop/games) to get started!
