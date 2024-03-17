export interface PresenceUpdate {
	guildId: string;
	guilds: string[];
	presences: {
		sessionId: string | null;
		since: number | null;
		state: string | null;
		status: number;
		type: number;
	}[];
	user: {
		avatar: string | null;
		flags: string;
		id: string;
		publicFlags: string;
		tag: string;
		username: string;
	}
}

export default PresenceUpdate;
