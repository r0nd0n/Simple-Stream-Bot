const { config } = require('dotenv');
config();

const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        Discord.IntentsBitField.Flags.GuildVoiceStates,
        Discord.IntentsBitField.Flags.Guilds,
        Discord.IntentsBitField.Flags.GuildMessages
    ]
});

const {
	NoSubscriberBehavior,
	createAudioPlayer,
	createAudioResource,
	entersState,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	joinVoiceChannel,
} = require('@discordjs/voice');

const player = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Play,
		maxMissedFrames: Math.round(5000 / 20),
	},
});

const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
	const newUdp = Reflect.get(newNetworkState, 'udp');
	clearInterval(newUdp?.keepAliveInterval);
  }

player.on('stateChange', (oldState, newState) => {
	Reflect.get(oldState, 'networking')?.off('stateChange', networkStateChangeHandler);
  	Reflect.get(newState, 'networking')?.on('stateChange', networkStateChangeHandler);
	  console.log('Connection state change from:' + oldState.status + ' to ' + newState.status)
	if ((oldState.status === AudioPlayerStatus.Idle || oldState.status === AudioPlayerStatus.Connecting) && newState.status === AudioPlayerStatus.Playing) {
		console.log('Playing audio output on audio player');
	} else if (oldState.status === VoiceConnectionStatus.Ready && newState.status === VoiceConnectionStatus.Connecting) {
		connection.configureNetworking();
	} 
	else if (newState.status === AudioPlayerStatus.Idle) {
		console.log('Playback has stopped. Attempting to restart.');
		attachRecorder();
	}	
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    attachRecorder();

    setTimeout(async () => {
        const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });
        connection.subscribe(player);
        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 2_000);
            return connection;
        } catch (error) {
            console.log(error.message ? "An error occured - " + error.message : "An error occurred.");
			connection.destroy();
            throw error;
        }
    }, 3_000);
});

function attachRecorder() {
	player.play(
		createAudioResource(process.env.RTMP_STREAM),
	);
	console.log('Attached recorder - ready to go!');
}

void client.login(process.env.DISCORD_TOKEN);
