import type { finishedGuild } from "@/Routes/v1/guilds/index.ts";
import type GuildMembers from "@/Utils/Cql/Types/GuildMember.ts";

export interface GuildCreate {
	guild: finishedGuild;
	member: GuildMembers,
	userId: string;
}
