import GuildMemberFlags from "@/Utils/Classes/BitFields/GuildMember.ts";
import type { PermissionKey } from "@/Utils/Classes/BitFields/Permissions.ts";
import Permissions from "@/Utils/Classes/BitFields/Permissions.ts";

class PermissionHandler {
	public guildMemberFlags: GuildMemberFlags;

	public memberRoles: {
		id: string;
		permissions: Permissions;
		position: number;
	}[];

	public channels: {
		id: string;
		overrides: {
			allow: Permissions;
			deny: Permissions;
			// Role / Member Id
			id: string;
			type: "Member" | "Role";
		}[];
	}[];

	public guildMemberId: string;

	public constructor(
		guildMemberId: string,
		guildMemberFlags: bigint | number | string,
		memberRoles: { id: string; permissions: [bigint | string, bigint | string][]; position: number; }[],
		channels?: {
			id: string;
			overrides: {
				allow: [bigint | string, bigint | string][];
				deny: [bigint | string, bigint | string][];
				id: string;
				type: "Member" | "Role";
			}[];
		}[],
	) {
		this.guildMemberId = guildMemberId;

		this.guildMemberFlags = new GuildMemberFlags(guildMemberFlags);

		this.memberRoles = memberRoles.map((Role) => ({
			id: Role.id,
			permissions: new Permissions(Role.permissions),
			position: Role.position,
		}));

		this.channels = channels?.map((Channel) => ({
			id: Channel.id,
			overrides: Channel.overrides.map((Override) => ({
				allow: new Permissions(Override.allow),
				deny: new Permissions(Override.deny),
				id: Override.id,
				type: Override.type,
			})),
		})) ?? [];
	}

	/**
	 *? Checks if you have permission on any role, also takes in account position (i.e if you have a role with the permission, but a role above that role denies it, then you don't have the permission)
	 */
	public hasAnyRole(permission: PermissionKey[], dupe?: boolean): boolean {
		// ? If you are the owner or co-owner, you have all permissions
		if (this.guildMemberFlags.has("Owner") || this.guildMemberFlags.has("CoOwner")) return true;

		const roles = this.memberRoles
			.filter((Role) => Role.permissions.has(permission))
			.sort((a, b) => b.position - a.position);

		if (dupe) return roles.length > 0;

		return roles.length > 0 && roles[0]!.permissions.has(permission);
	}

	/**
	 *? If you are able to manage a specific role (mainly checks the position of the role) 
	 */
	public canManageRole(role: { id: string; permissions: [bigint | string, bigint | string][]; position: number; }): boolean {
		if (this.guildMemberFlags.has("Owner") || this.guildMemberFlags.has("CoOwner")) return true;

		const membersHighestRole = this.memberRoles.sort((a, b) => b.position - a.position)[0];

		if (!membersHighestRole) return false;

		return membersHighestRole.position > role.position;
	}

	/**
	 *? Checks if you have permissiosn to a specific channel
	 */
	public hasChannelPermission(channelId: string, permission: PermissionKey[]): boolean {
		if (this.guildMemberFlags.has("Owner") || this.guildMemberFlags.has("CoOwner")) return true;

		const channel = this.channels.find((Channel) => Channel.id === channelId);

		if (!channel) return false;

		const overrides = channel.overrides.filter((Override) => Override.id === this.guildMemberId || this.memberRoles.some((Role) => Role.id === Override.id));

		if (overrides.length === 0) return false;

		const allow = overrides.some((Override) => Override.allow.has(permission));

		const deny = overrides.some((Override) => Override.deny.has(permission));

		return allow && !deny;
	}

}

export default PermissionHandler;
