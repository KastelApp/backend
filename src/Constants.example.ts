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

import process from 'node:process';

const Settings = {
	Max: {
		GuildCount: 50,
		ChannelCount: 250,
		RoleCount: 250,
		InviteCount: 500,
		BanCount: Number.POSITIVE_INFINITY,
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
	Min: {
		UsernameLength: 2,
		GuildNameLength: 2,
	},
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
			'system',
			'System',
			'SYSTEM',
		],
		Guilds: [],
		Channels: [],
		Global: [
			/\b(?:kastel|discord|kastelapp\.com|discordapp\.com)\b/gi, // Blocks Discord & Kastel Stuff (just so people don't try to use it)
		],
	},
};

// Note: You should NOT change these at all unless you know what you are doing
// The frontend depends on these
const GuildFeatures = [{
	Name: 'Partnered',
	Deprecated: false, // deprecated means it will be removed in the future
	Default: false, // If servers are given this by default on guild creation
	Settable: false, // if a user can set it themselves
	NewDefault: false // If its a "new default" this means if we lets say fetch a guild we need to add this
}, {
	Name: 'Verified',
	Deprecated: false,
	Enabled: false,
	Settable: false,
	NewDefault: false
}, {
	Name: 'Official',
	Deprecated: false,
	Enabled: false,
	Settable: false,
	NewDefault: false
}] as const;

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

const GuildFlags = {
	Verified: 1 << 0,
	Partnered: 1 << 1,
	Official: 1 << 2,
	NoOwner: 1 << 10,
};

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
};

const Flags = {
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
	Ghost: 1n << 25n,
	System: 1n << 26n,
	Staff: 1n << 27n,
	BetaTester: 1n << 28n,
	Bot: 1n << 29n,
	VerifiedBot: 1n << 30n,
	Spammer: 1n << 31n,
	Tos: 1n << 32n,
	GuildBan: 1n << 33n,
	FriendBan: 1n << 34n,
	GroupchatBan: 1n << 35n,
	WaitingOnAccountDeletion: 1n << 36n,
	WaitingOnDisableDataUpdate: 1n << 37n,
	AccountDeleted: 1n << 38n,
	EmailVerified: 1n << 39n,
	Disabled: 1n << 40n,
	Terminated: 1n << 41n,
	TwoFaEnabled: 1n << 42n,
	TwoFaVerified: 1n << 43n,
	// Temp Increased Values (Testing)
	IncreasedGuildCount100: 1n << 80n,
	IncreasedGuildCount200: 1n << 81n,
	IncreasedGuildCount500: 1n << 82n,
	IncreasedMessageLength2k: 1n << 83n,
	IncreasedMessageLength4k: 1n << 84n,
	IncreasedMessageLength8k: 1n << 85n,
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
	Blocked: 1 << 0,
	FriendRequest: 1 << 1,
	Friend: 1 << 2,
	Denied: 1 << 3,
	MutualFriend: 1 << 4,
};

const AuditLogActions = {};

const Relative = {
	Version: '0.0.1',
};

const VerificationFlags = {
	VerifyEmail: 1 << 0,
	ForgotPassword: 1 << 1,
	ChangeEmail: 1 << 2,
};

const Snowflake = {
	Epoch: 1_641_016_800_000,
	ProcessId: process.pid,
	ProcessIdBytes: 1,
	SequenceBytes: 6,
	WorkerId: 5,
	WorkerIdBytes: 12,
};

export default {
	Settings,
	AllowedMentions,
	GuildFlags,
	ChannelTypes,
	Presence,
	Flags,
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
	GuildFeatures,
};

export {
	Settings,
	AllowedMentions,
	GuildFlags,
	ChannelTypes,
	Presence,
	Flags,
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
	GuildFeatures,
};
