/* eslint-disable unicorn/prefer-math-trunc */
/* eslint-disable sonarjs/no-identical-expressions */
/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import process from "node:process";

const Settings = {
	Max: {
		GuildCount: 50,
		ChannelCount: 250,
		RoleCount: 250,
		InviteCount: 500,
		BanCount: 5_000, // ikik, 5k bans isn't much but its only temp, Nobody should hit this limit in beta
		FriendCount: 100,
		MemberCount: 500,
		// The max amount of usernames, lets say the name is "cat" there can be 9999 accounts then once we
		// hit the max nobody can switch tags, So we limit to 5k so people can switch tags
		UsernameCount: 5_000,
		GuildNameLength: 100,
		GuildDescriptionLength: 500,
		GuildFetchLimit: 100, // The amount they can request in the /guilds/fetch route
		MessageLength: 1_000, // The max amount of characters in a message
		MaxFileSize: 12 * 1_024 * 1_024, // 8MB
	},
	Min: {},
	Captcha: {
		// The routes that have captcha (If you want them to have captcha)
		Login: false,
		Register: false,
		ForgotPassword: false,
		ChangePassword: false,
		ChangeEmail: false,
	},
	DisallowedWords: {
		// can be strings or regex (in arrays)
		Username: [
			// Blocking System so people can't use it (besides the system account itself)
			"system",
			"System",
			"SYSTEM",
		],
		Guilds: [],
		Channels: [],
		Global: [],
	},
};

// Note: You should NOT change these at all unless you know what you are doing
// The frontend depends on these
const GuildFeatures = [
	{
		Name: "Partnered",
		Deprecated: false, // deprecated means it will be removed in the future
		Default: false, // If guilds are given this by default on guild creation
		Settable: false, // if a user can set it themselves
		NewDefault: false, // If its a "new default" this means if we lets say fetch a guild we need to add this
	},
	{
		Name: "Verified", // Ran by an official company / person
		Deprecated: false,
		Enabled: false,
		Settable: false,
		NewDefault: false,
	},
	{
		Name: "Official", // Ran by Kastel themselves (Think the Kastel Developers guild)
		Deprecated: false,
		Enabled: false,
		Settable: false,
		NewDefault: false,
	},
	{
		Name: "Maintenance", // Disallows anyone without ManageGuild to view the guild / access it
		Deprecated: false,
		Enabled: true,
		Settable: true,
	},
	{
		Name: "InternalStaffGuild", // Staff only, for internal use (This is where Community Announcements will be made and some other stuff)
		Deprecated: false,
		Enabled: false,
		Settable: false,
	},
] as const;

const AllowedMentions: {
	All?: number;
	Everyone: number;
	Here: number;
	Roles: number;
	Users: number;
} = {
	Everyone: 1 << 5,
	Here: 1 << 6,
	Roles: 1 << 7,
	Users: 1 << 8,
};

AllowedMentions.All = AllowedMentions.Everyone | AllowedMentions.Here | AllowedMentions.Roles | AllowedMentions.Users;

const GuildMemberFlags = {
	Left: 1 << 0,
	In: 1 << 1,
	Kicked: 1 << 2,
	Banned: 1 << 3,
	Owner: 1 << 4,
	CoOwner: 1 << 5,
};

const ChannelTypes = {
	GuildCategory: 1 << 0,
	GuildText: 1 << 1,
	GuildNews: 1 << 2,
	GuildRules: 1 << 3,
	GuildVoice: 1 << 4,
	GuildNewMember: 1 << 5,
	Dm: 1 << 10,
	GroupChat: 1 << 11,
};

const Presence = {
	Online: 1 << 0,
	Idle: 1 << 1,
	Dnd: 1 << 2,
	Offline: 1 << 3,
};

const MessageFlags = {
	System: 1 << 0,
	Normal: 1 << 1,
	Reply: 1 << 2,
	Deleted: 1 << 3, // NOTE: this is only used when the message has the reported flag
	Reported: 1 << 4, // Note: this is private to the users (they won't receive the flag)
};

const InviteFlags = {
	Normal: 1 << 0, // invite for a guild channel
	GroupChat: 1 << 1, // invite for a gdm
	FriendLink: 1 << 2, // This lets you "add" a friend rather then having them send you a friend request, this is an instant friend
	Vanity: 1 << 3, // This is a vanity invite (like kastelapp.com/invite/kastel) Undeleatable 1 per guild
};

const PublicFlags = {
	StaffBadge: 1n << 0n,
	GhostBadge: 1n << 1n,
	SponsorBadge: 1n << 2n,
	DeveloperBadge: 1n << 3n,
	VerifiedBotDeveloperBadge: 1n << 4n,
	OriginalUserBadge: 1n << 5n,
	PartnerBadge: 1n << 6n,
	ModeratorBadge: 1n << 7n,
	MinorBugHunterBadge: 1n << 8n,
	IntermediateBugHunterBadge: 1n << 9n,
	MajorBugHunterBadge: 1n << 10n,
};

const PrivateFlags = {
	Ghost: 1n << 0n,
	System: 1n << 1n,
	Staff: 1n << 2n,
	BetaTester: 1n << 3n,
	Bot: 1n << 4n,
	VerifiedBot: 1n << 5n,
	Spammer: 1n << 6n,
	Tos: 1n << 7n,
	GuildBan: 1n << 8n,
	FriendBan: 1n << 9n,
	GroupchatBan: 1n << 10n,
	WaitingOnAccountDeletion: 1n << 11n,
	WaitingOnDisableDataUpdate: 1n << 12n,
	AccountDeleted: 1n << 13n,
	EmailVerified: 1n << 14n,
	Disabled: 1n << 15n,
	Terminated: 1n << 16n,
	TwoFaEnabled: 1n << 17n,
	TwoFaVerified: 1n << 18n,
	// Temp Increased Values (Testing)
	IncreasedGuildCount100: 1n << 25n,
	IncreasedGuildCount200: 1n << 26n,
	IncreasedGuildCount500: 1n << 27n,
	IncreasedMessageLength2k: 1n << 28n,
	IncreasedMessageLength4k: 1n << 29n,
	IncreasedMessageLength8k: 1n << 30n,
};

const MixedPermissions = {
	ManageMessages: 1n << 9n,
	SendMessages: 1n << 10n,
	ReadMessages: 1n << 11n,
	CreateInvites: 1n << 14n,
	BypassSlowmode: 1n << 16n,
	ManageWebhooks: 1n << 19n,
};

const RolePermissions = {
	Administrator: 1n << 0n,
	ManageGuild: 1n << 1n,
	ManageRoles: 1n << 2n,
	ManageChannels: 1n << 3n,
	ManageMembers: 1n << 4n,
	ManageEmojis: 1n << 5n,
	ManageBans: 1n << 6n,
	ManageNicknames: 1n << 7n,
	ManageInvites: 1n << 8n,
	KickMembers: 1n << 12n,
	BanMembers: 1n << 13n,
	ChangeNickname: 1n << 18n,
	ViewAuditLog: 1n << 20n,
	AddBots: 1n << 21n,
	ViewChannels: 1n << 22n,
};

const ChannelPermissions = {
	ViewChannel: 1n << 15n,
	ManageChannel: 1n << 17n,
};

const Permissions = {
	...MixedPermissions,
	...RolePermissions,
	...ChannelPermissions,
};

const RelationshipFlags = {
	None: 1 << 0,
	Blocked: 1 << 1,
	FriendRequest: 1 << 2,
	Friend: 1 << 3,
	Denied: 1 << 4,
	MutualFriend: 1 << 5,
};

const AuditLogActions = {};

const Relative = {
	Version: "0.0.1",
};

const VerificationFlags = {
	VerifyEmail: 1 << 0,
	ForgotPassword: 1 << 1,
	ChangeEmail: 1 << 2,
};

const Snowflake = {
	Epoch: 1_641_016_800_000n,
	SequenceBytes: 6,
	WorkerIdBytes: 12,
	ProcessIdBytes: 1,
	WorkerId: 5,
	ProcessId: process.pid,
};

const PermissionOverrideTypes = {
	Role: 1 << 0,
	Member: 1 << 1,
	Everyone: 1 << 2,
};

export default {
	Settings,
	AllowedMentions,
	ChannelTypes,
	Presence,
	PrivateFlags,
	Permissions,
	RelationshipFlags,
	AuditLogActions,
	Relative,
	GuildMemberFlags,
	MessageFlags,
	MixedPermissions,
	RolePermissions,
	ChannelPermissions,
	VerificationFlags,
	Snowflake,
	PublicFlags,
	GuildFeatures,
	PermissionOverrideTypes,
	InviteFlags,
};

export {
	Settings,
	AllowedMentions,
	ChannelTypes,
	Presence,
	PrivateFlags,
	Permissions,
	RelationshipFlags,
	AuditLogActions,
	Relative,
	GuildMemberFlags,
	MessageFlags,
	MixedPermissions,
	RolePermissions,
	ChannelPermissions,
	VerificationFlags,
	Snowflake,
	PublicFlags,
	GuildFeatures,
	PermissionOverrideTypes,
	InviteFlags,
};
