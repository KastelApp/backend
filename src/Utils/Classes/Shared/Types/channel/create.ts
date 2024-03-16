export interface ChannelCreate {
	ageRestricted: boolean;
	allowedMentions: number;
	channelId: string;
	children: string[];
	description: string | null;
	guildId: string | null;
	name: string;
	parentId: string | null;
	permissionOverrides: string[];
	position: number;
	slowmode: number;
	type: number;
}

export default ChannelCreate;
