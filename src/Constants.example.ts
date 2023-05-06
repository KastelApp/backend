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
		UsernameLength: 32,
		// The max amount of usernames, lets say the name is "cat" there can be 9999 accounts then once we
		// hit the max nobody can switch tags, So we limit to 5k so people can switch tags
		UsernameCount: 5_000,
		GuildNameLength: 100,
		GuildDescriptionLength: 500,
		GuildFetchLimit: 100, // The amount they can request in the /guilds/fetch route
		MessageLength: 1_000, // The max amount of characters in a message
		MaxFileSize: 8 * 1_024 * 1_024, // 8MB
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
		Global: [],
	},
};

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
	Verified: 1,
	Partnered: 1 << 1,
	Official: 1 << 2,
	NoOwner: 1 << 10, // NoOwner is a rare flag, Should never be found in the wild (but it is possible)
};

const GuildMemberFlags = {
	Left: 1, // If they left the guild
	In: 1 << 1, // If they are in the guild
	Kicked: 1 << 2, // If they were kicked from the guild
	Banned: 1 << 3, // If they were banned from the guild
	Owner: 1 << 4, // If they are the owner of the guild
	CoOwner: 1 << 5, // If they are a co-owner of the guild (Pretty much the same as Owner but they can't delete the guild (or change the owner)))
};

const ChannelTypes = {
	GuildCategory: 1,
	GuildText: 1 << 1,
	GuildNews: 1 << 2,
	GuildRules: 1 << 3,
	GuildVoice: 1 << 4,
	GuildNewMember: 1 << 5,
	Dm: 1 << 10,
	GroupChat: 1 << 11,
};

const Presence = {
	Online: 1,
	Idle: 1 << 1,
	Dnd: 1 << 2,
	Offline: 1 << 3,
};

const MessageFlags = {
	System: 1,
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
	// We just got this flag so we can find all accounst with it and do the deletion stuff as well as giving them a 30 day period to recover their account
	// The plan is just to remove their email,phonenumber,username,tag,avatar and password
	// After we do that we will go through all messages and remove the content (replacing it with "[Deleted Message]"),
	// We will also remove all guilds they are in and remove all friends they have
	WaitingOnAccountDeletion: 1n << 36n,
	// This is for when the user is waiting on their data to be updated after they disabled their account
	// Like changing their username & Tag and such
	WaitingOnDisableDataUpdate: 1n << 37n,
};

// These are BigInts since BigInt Bitfields don't loop around to One after 32 (1 << 32 loops 1 but 1n << 32n goes to 4294967296n)

// Mixed Permissions are stuff for like roles and channels
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
	Blocked: 1,
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
	// Just flags for Verification Links
	VerifyEmail: 1,
	ResetPassword: 1 << 1,
	ForgotPassword: 1 << 2,
	ChangeEmail: 1 << 3,
	ChangePassword: 1 << 4,
	Used: 1 << 5,
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
};
