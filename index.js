var Discord = require('discord.js');
var Tail = require('tail').Tail;
var exec = require('child_process').exec;
var config = require('./config.js');

// globals
var gameChannel = null;
var consoleChannel = null;
var bot = null;
var botUserId = 0;
var regexConsoleLine = /^\[[0-9]{2}:[0-9]{2}:[0-9]{2}\] \[Server thread\/INFO\]: /
var regexConsoleChat = /^<([A-Za-z0-9_]{3,15})> (.+)$/
var regexConsolePlayers = /^There are ([0-9]{1,3}) of a max [0-9]{1,3} players online: ?([A-Za-z0-9,_ ]*)$/
var regexConsoleJoin = /^([A-Za-z0-9_]{3,15}) joined the game$/
var regexConsoleLeave = /^([A-Za-z0-9_]{3,15}) left the game$/

// start tail
tail = new Tail(config.logFile, {
	follow: true
});
tail.on("line", processConsoleLine);

// start discord
bot = new Discord.Client();
bot.on('ready', function() {
	console.log('Ready!');
	botUserId = bot.user.id;
	gameChannel = bot.channels.get(config.gameChannelId);
	consoleChannel = bot.channels.get(config.consoleChannelId);
});
bot.login(config.botUserToken);
bot.on('message', processDiscordChat);

// process chat messages coming from discord and pass them to the server
function processDiscordChat(message) {
	if (message.author.id == botUserId) return;
	if (message.channel.id == config.gameChannelId) {
		var author = message.author.username;
		if (message.member && message.member.nickname) author = message.member.nickname;
		var text = message.content;
		var json = config.prepRawMessage(author, text, message);
		tellRaw(json);
	} else if (message.channel.id == config.consoleChannelId) {
		sendConsoleCommand(message.content);
	}
}

// process console lines and send chat and player info to discord
function processConsoleLine(line) {
	if (consoleChannel != null) {
		consoleChannel.send(line);
	}
	
	if (!regexConsoleLine.test(line)) return;
	line = line.substr(33);	
	
	match = line.match(regexConsoleChat);
	if (match != null) {
		var name = match[1];
		var message = match[2];		
		if (gameChannel != null) {			
			gameChannel.send("<**" + name + "**> " + message);
		}
		return;
	}
	match = line.match(regexConsoleJoin);
	if (match != null) {
		if (gameChannel != null) {
			gameChannel.send("**" + line + "**");
		}
		sendConsoleCommand("list");
		return;
	}
	match = line.match(regexConsoleLeave);
	if (match != null) {
		if (gameChannel != null) {
			gameChannel.send("**" + line + "**");
		}
		sendConsoleCommand("list");
		return;
	}
	match = line.match(regexConsolePlayers);
	if (match != null) {
		var count = match[1];
		var list = match[2];
		if (gameChannel != null) {
			gameChannel.send("**Players online: **" + list);
			/*gameChannel.setTopic("There are " + count + " players in game: " + list)
				.catch(function(e) {
					console.log('settopic error', e);
				});*/
		}
		return;
	}
}

function sendConsoleCommand(cmd) {
	var shell = config.prepConsoleCommand(cmd);
	exec(shell, function(err, out, code) {
		console.log(out);
	});
}

function tellRaw(json) {
	var raw = JSON.stringify(json);
	var cmd = "tellraw @a " + raw;
	sendConsoleCommand(cmd);
}
