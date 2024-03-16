import { permissionOverrideTypes } from "@/Constants.ts";
import { opCodes } from "@/Utils/Classes/Events/OpCodes.ts";
import type WebSocket from "@/Utils/Classes/WebSocket";
import PermissionHandler from "@/Utils/Versioning/v1/PermissionCheck.ts";
import type { GuildCreate } from "../../Types/guild/create";

const isGuildPayload = (data: unknown): data is GuildCreate => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("guild" in data)) return false;
    if (!("member" in data)) return false;

    return "userId" in data;
};

const guildCreate = (ws: WebSocket, data: unknown) => {
    if (!isGuildPayload(data)) {
        ws.logger.debug("Invalid guildCreate Payload");

        return;
    }

    ws.publish(`user:${data.userId}`, {
        op: opCodes.event,
        event: "GuildCreate",
        data: data.guild,
    });

    const topics: string[] = [`guild:${data.guild.id}`, `guild:${data.guild.id}:members`];

    const permCheck = new PermissionHandler(
        data.userId,
        data.member.flags,
        data.guild.roles?.map((role) => ({
            id: role.id,
            permissions: role.permissions,
            position: role.position,
        })) ?? [],
        data.guild.channels?.map((channel) => ({
            id: channel.id,
            overrides: Object.entries(channel.permissionOverrides).map(([id, override]) => ({
                id,
                allow: override.allow,
                deny: override.deny,
                type: override.type === permissionOverrideTypes.Member ? "Member" : "Role",
            })),
        })) ?? [],
    );

    for (const channel of data.guild.channels!) {
        if (permCheck.hasChannelPermission(channel.id, ["ViewChannels"])) {
            topics.push(`channel:messages:${channel.id}`);
            topics.push(`channel:messages:${channel.id}:reactions`);
            topics.push(`channel:messages:${channel.id}:pins`);
        }

        if (permCheck.hasChannelPermission(channel.id, ["ViewChannels", "ViewMessageHistory"]))
            topics.push(`channel:messages:${channel.id}:typing`); // ? can only see typing events if they can see the channel and view messages

        topics.push(`channel:${channel.id}`);
    }

    ws.subscribe({
        userId: data.userId,
    }, topics);
};

export { guildCreate };
