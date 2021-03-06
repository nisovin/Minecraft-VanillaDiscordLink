module.exports = {
	
	// the app bot user login token from the discord dev page
	botUserToken: '00000000000000000000000000000000000000000000000000000000',
	
	// the channel id in discord to sync with in-game chat
	gameChannelId: '000000000000000000',
	
	// the channel id in discord to sync with the server console
	consoleChannelId: '000000000000000000',
	
	// path to the server log file
	logFile: '/home/user/minecraftserver/logs/latest.log',
	
	// rcon info
	useRcon: true,
	rconHost: 'localhost',
	rconPort: 25575,
	rconPassword: 'abcdefg',
	
	// function to turn a console command into a shell command to be injected into the minecraft server (return false to disable this feature)
	prepConsoleCommand: function(cmd) {
		var screenName = 'minecraft'; // name of screen session
		// this is probably dangerous
		return 'screen -x ' + screenName + ' -X stuff "' + cmd.replace(/"/g, '\\"') + '$(printf \'\\r\')"';
	},
	
	// function to turn a message from discord into a raw json message for minecraft
	prepRawMessage: function(author, text, message) {
		return [
			{"text": "["},
			{"text": "D", color: "blue"},
			{"text": "] <", color: "reset"},
			{"text": author, color: "green"},
			{"text": "> " + text, color: "reset"}
		];
	}
	
}