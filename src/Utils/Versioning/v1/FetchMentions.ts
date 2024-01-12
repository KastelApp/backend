// channels are <#id>
// roles are <@&id>
// users are <@!?id>

export const fetchMentions = (
	content: string,
): {
	channels: string[];
	roles: string[];
	users: string[];
} => {
	const regex = /<#(?<channels>\d+)>|<@&(?<roles>\d+)>|<@!?(?<users>\d+)>/g;

	const channels: string[] = [];
	const roles: string[] = [];
	const users: string[] = [];

	let match: RegExpExecArray | null;

	while ((match = regex.exec(content)) !== null) {
		if (match[1]) {
			channels.push(match[1]);
		} else if (match[2]) {
			roles.push(match[2]);
		} else if (match[3]) {
			users.push(match[3]);
		}
	}

	return {
		channels: [...new Set(channels)],
		roles: [...new Set(roles)],
		users: [...new Set(users)],
	};
};
