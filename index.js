var Discord = require('discord.js');
var Tail = require('tail').Tail;
var Rcon = require('rcon');
var exec = require('child_process').exec;
var config = require('./config.js');

// globals
var gameChannel = null;
var consoleChannel = null;
var rcon = null;
var rconConnected = false;
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

// start rcon
function startRcon() {
	rcon = new Rcon(config.rconHost, config.rconPort, config.rconPassword);
	rcon.on('auth', function() {
		console.log('Rcon connected');
		rconConnected = true;
	});
	rcon.on('response', function(str) {
		//console.log('Rcon response', str);
	});
	rcon.on('error', function(err) {
		console.log('Rcon error', err);
		if (!rcon.hasAuthed) {
			setTimeout(startRcon, 5000);
		}
	});
	rcon.on('end', function() {
		console.log('Rcon disconnected');
		rconConnected = false;
		setTimeout(startRcon, 5000);
	});
	rcon.connect();
}
if (config.useRcon) {
	startRcon();
}

// start discord
bot = new Discord.Client();
bot.on('ready', function() {
	console.log('Discord connected');
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
		// get and clean author and message
		var author = message.author.username;
		if (message.member && message.member.nickname) author = message.member.nickname;
		var text = message.content;
		author = author.replace(/[^A-Za-z0-9_\- ]/g, '');
		text = text.replace(/[^A-Za-z0-9 !(),.?':;_\-+]/g, '');
		if (text.length > 250) text = text.substr(0, 250);
		// build and send json
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
		}
		return;
	}
}

// send console command, use rcon if possible, fall back to shell command
function sendConsoleCommand(cmd) {
	if (rconConnected) {
		console.log('sending rcon cmd');
		rcon.send(cmd);
	} else {
		var shell = config.prepConsoleCommand(cmd);
		if (shell) {
			exec(shell, function(err, out, code) {
				console.log(out);
			});
		}
	}
}

// build tellraw command
function tellRaw(json) {
	var raw = JSON.stringify(json);
	var cmd = "tellraw @a " + raw;
	sendConsoleCommand(cmd);
}
