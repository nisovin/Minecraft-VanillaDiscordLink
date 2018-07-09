Minecraft VanillaDiscordLink
============================

This is a simple NodeJS script that links a Discord channel with a vanilla Minecraft server chat. It works without using any Minecraft mods.
This is provided as-is, I haven't done really any testing or error checking.

The script expects that you are running the server on Linux in a screen session. If this is not the case, you may be able to get it to work
by changing the function in the config file, but you'll need to come up with a way to inject commands into the running server.

This should work with pretty much any vanilla Minecraft version. It will probably work with modded versions as well, but I have not tested them.

Setup
-----

* Install [https://nodejs.org/en/download/](NodeJS)
* Put the index.js, config.js, and package.json files into a folder
* Run ```npm install``` to install dependencies
* [https://discordapp.com/developers/applications/me](Set up a Discord bot) and get a login token

Config
------

Update the config.js file with your own data.

* Set your Discord bot's login token
* Channel IDs can be found in Discord by turning on Developer mode.
* Be careful with consoleChannelId! If you set this, anyone in that channel will be able to run commands on your server.
* Provide the full path to the server's log file.
* Change the prepConsoleCommand function to set your own screen name (or modify it to work some other way if desired).
* Change the appearance of discord messages in-game (if desired) by modifying the prepRawMessage function.

Running
-------

You can run this however you want, I recommend using [https://www.npmjs.com/package/forever](forever).

```
npm install forever -g
cd /path/to/the/script
forever start index.js
```