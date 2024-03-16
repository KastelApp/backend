import { presenceTypes, statusTypes } from "@/Constants.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import { opCodes } from "@/Utils/Classes/Events/OpCodes.ts";
import type WebSocket from "@/Utils/Classes/WebSocket";
import type { GuildMemberAdd } from "../../Types/member/add";

const isMemberPayload = (data: unknown): data is GuildMemberAdd => {
	if (typeof data !== "object" || data === null || data === undefined) return false;

	const items = [
		"userId",
		"guildId",
		"member"
	];

	for (const item of items) {
		if (!(item in data)) return false;
	}

	return true;
};

const guildMemberAdd = async (ws: WebSocket, data: unknown) => {
	if (!isMemberPayload(data)) {
		ws.logger.debug("Invalid guildMemberAdd Payload");

		return;
	}
	
	const fetchedPresence = await ws.cache.get(`user:${Encryption.encrypt(data.userId)}`);
	const parsedPresence = JSON.parse(
		(fetchedPresence as string) ??
		`[{ "sessionId": null, "since": null, "state": null, "type": ${presenceTypes.custom}, "status": ${statusTypes.offline} }]`,
	) as { sessionId: string | null; since: number | null; state: string | null; status: number; type: number; }[];


	const user = await ws.cassandra.models.User.get({
		userId: Encryption.encrypt(data.userId)
	}, {
		fields: ["avatar", "flags", "userId", "publicFlags", "username", "tag"]
	});
	
	if (!user) {
		ws.logger.debug("User not found in database", data.userId);

		return;
	
	}

	ws.publish(`guild:${data.guildId}:members`, {
		op: opCodes.event,
		event: "GuildMemberAdd",
		data: {
			user: Encryption.completeDecryption({
				...user,
				id: user.userId,
				userId: undefined
			}),
			guildId: data.guildId,
			roles: data.member.roles,
			owner: data.member.owner,
			joinedAt: data.member.joinedAt,
			nickname: data.member.nickname,
			presence: parsedPresence.map((prev) => ({
				...prev,
				sessionId: undefined,
				current: undefined,
			}))
		}
	});
};

export { guildMemberAdd };
