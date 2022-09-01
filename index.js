const { config } = require('dotenv');
config();

const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILD_VOICE_STATES,
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES
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

player.on('stateChange', (oldState, newState) => {
	if (oldState.status === AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Playing) {
		console.log('Playing audio output on audio player');
	} else if (newState.status === AudioPlayerStatus.Idle) {
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
