import {
	Permissions as PermissionConstants,
	GuildMemberFlags as GuildMemberFlagsConstant,
} from "../../../Constants.ts";
import { FlagUtils } from "../../Classes/BitFields/NewFlags.ts";

class PermissionHandler {
	public GuildMemberFlags: FlagUtils<typeof GuildMemberFlagsConstant>;

	public MemberRoles: {
		Id: string;
		Permissions: bigint;
		Position: number;
	}[];

	public Channels: {
		Id: string;
		Overrides: {
			Allow: bigint;
			Deny: bigint;
			// Role / Member Id
			Id: string;
			Type: "Member" | "Role";
		}[];
	}[];

	public GuildMemberId: string;

	public constructor(
		GuildMemberId: string,
		GuildMemberFlags: bigint | number | string,
		MemberRoles: { Id: string; Permissions: bigint | number | string; Position: number }[],
		Channels?: {
			Id: string;
			Overrides: {
				Allow: bigint | number | string;
				Deny: bigint | number | string;
				Id: string;
				Type: "Member" | "Role";
			}[];
		}[],
	) {
		this.GuildMemberId = GuildMemberId;

		this.GuildMemberFlags = new FlagUtils<typeof GuildMemberFlagsConstant>(GuildMemberFlags, GuildMemberFlagsConstant);

		this.MemberRoles = MemberRoles.map((Role) => {
			return {
				Id: Role.Id,
				Permissions: BigInt(Role.Permissions),
				Position: Role.Position,
			};
		});

		this.Channels =
			Channels?.map((Channel) => {
				return {
					Id: Channel.Id,
					Overrides: Channel.Overrides.map((Override) => {
						return {
							Allow: BigInt(Override.Allow),
							Deny: BigInt(Override.Deny),
							Id: Override.Id,
							Type: Override.Type,
						};
					}),
				};
			}) ?? [];
	}

	public HasAnyRole(Permission: bigint | number | keyof typeof PermissionConstants, dupe?: boolean) {
		const FoundPermission = typeof Permission === "string" ? PermissionConstants[Permission] : BigInt(Permission);

		if (this.GuildMemberFlags.has("Owner") || this.GuildMemberFlags.has("CoOwner")) return true;

		if (!dupe && this.HasAnyRole("Administrator", true)) return true;

		return this.MemberRoles.some((Role) => {
			return (Role.Permissions & FoundPermission) === FoundPermission;
		});
	}

	public CanManageRole(Role: { Permissions: bigint | number | keyof typeof PermissionConstants; Position: number }) {
		if (!this.HasAnyRole("ManageRoles")) return false;
		if (this.GuildMemberFlags.has("Owner") || this.GuildMemberFlags.has("CoOwner")) return true;

		const HighestRole = this.MemberRoles.sort((a, b) => b.Position - a.Position)[0];

		return !(!HighestRole?.Position || HighestRole.Position <= Role.Position);
	}

	public HasChannelPermission(channelId: string, permission: keyof typeof PermissionConstants): boolean {
		const Channel = this.Channels.find((channel) => channel.Id === channelId);

		if (!Channel) return false;

		if (this.HasAnyRole("Administrator")) return true;

		const UserOverride = Channel.Overrides.find(
			(override) => override.Type === "Member" && override.Id === this.GuildMemberId,
		);
		if (UserOverride) {
			if ((BigInt(UserOverride.Allow) & PermissionConstants[permission]) === PermissionConstants[permission])
				return true;
			if ((BigInt(UserOverride.Deny) & PermissionConstants[permission]) === PermissionConstants[permission])
				return false;
		}

		for (const Role of this.MemberRoles) {
			const RoleOverride = Channel.Overrides.find((override) => override.Type === "Role" && override.Id === Role.Id);

			if (RoleOverride) {
				if ((BigInt(RoleOverride.Allow) & PermissionConstants[permission]) === PermissionConstants[permission])
					return true;
				if ((BigInt(RoleOverride.Deny) & PermissionConstants[permission]) === PermissionConstants[permission])
					return false;
			}
		}

		return this.HasAnyRole(permission);
	}
}

export default PermissionHandler;
