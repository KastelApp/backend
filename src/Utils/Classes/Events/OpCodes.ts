const opCodes = {
	event: 0, // ? dispatched events, i.e "ChannelCreate"
	identify: 1,
	ready: 2,
	heartbeat: 3,
	presenceUpdate: 4,
	// ? When a guild gets large enough, we do not want to continuously send the entire guild to the client, so when the client starts up the guild will appear as "unavailable"
	// ? Then if the user clicks on the guild, we'll request the guild data, Upsides to this is less memory usage for large guilds, downside to this is when the user clicks on the guild, there will be a slight delay before the guild is loaded
	// ? Soution to that is possibly store (client side) guilds they access actively, and if one of the guilds is unavailable, we'll request the guild data in the background on startup
	requestGuild: 5,
	// ? Like discords, once the guild gets enough members you'll only receive the top 200 members, then as you scroll down it requests more members
	requestGuildMembers: 6,
	resume: 7,
	heartbeatAck: 8,
};

const userSendCodes = [
	// ? these are the codes the client can send
	opCodes.identify,
	opCodes.heartbeat,
	opCodes.presenceUpdate,
	opCodes.requestGuild,
	opCodes.requestGuildMembers,
	opCodes.resume,
];

export { opCodes, userSendCodes };
