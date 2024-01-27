import { version } from "../package.json";

const settings = {
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
const guildFeatures = [
	{
		name: "Partnered",
		deprecated: false, // deprecated means it will be removed in the future
		default: false, // If guilds are given this by default on guild creation
		settable: false, // if a user can set it themselves
		newDefault: false, // If its a "new default" this means if we lets say fetch a guild we need to add this
	},
	{
		name: "Verified", // Ran by an official company / person
		deprecated: false,
		enabled: false,
		settable: false,
		newDefault: false,
	},
	{
		name: "Official", // Ran by Kastel themselves (Think the Kastel Developers guild)
		deprecated: false,
		enabled: false,
		settable: false,
		newDefault: false,
	},
	{
		name: "Maintenance", // Disallows anyone without ManageGuild to view the guild / access it
		deprecated: false,
		enabled: true,
		settable: true,
	},
	{
		name: "InternalStaffGuild", // Staff only, for internal use (This is where Community Announcements will be made and some other stuff)
		deprecated: false,
		enabled: false,
		settable: false,
	}
] as const satisfies {
	default?: boolean;
	deprecated: boolean;
	enabled?: boolean;
	name: string;
	newDefault?: boolean;
	settable?: boolean;
}[];

const allowedMentions: {
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

allowedMentions.All = allowedMentions.Everyone | allowedMentions.Here | allowedMentions.Roles | allowedMentions.Users;

const guildMemberFlags = {
	Left: 1 << 0,
	In: 1 << 1,
	Kicked: 1 << 2,
	Banned: 1 << 3,
	Owner: 1 << 4,
	CoOwner: 1 << 5,
};

const channelTypes = {
	GuildCategory: 1 << 0,
	GuildText: 1 << 1,
	GuildNews: 1 << 2,
	GuildRules: 1 << 3,
	GuildVoice: 1 << 4,
	GuildNewMember: 1 << 5,
	Dm: 1 << 10,
	GroupChat: 1 << 11,
};

const presenceTypes = {
	custom: 0,
	playing: 1,
	watching: 2,
	listening: 3,
	streaming: 4
};

const statusTypes = { // ? can only have one at a time besides if you are offline, so if you are offline you can have 1 << 1 | 1 << 2 which means, you are offline but your are idle
	offline: 1 << 0,
	online: 1 << 1,
	idle: 1 << 2,
	dnd: 1 << 3,
	invisible: 1 << 4,
}

const messageFlags = {
	System: 1 << 0,
	Normal: 1 << 1,
	Deleted: 1 << 3, // NOTE: this is only used when the message has the reported flag
	Reported: 1 << 4, // Note: this is private to the users (they won't receive the flag)
};

const inviteFlags = {
	Normal: 1 << 0, // invite for a guild channel
	GroupChat: 1 << 1, // invite for a gdm
	FriendLink: 1 << 2, // This lets you "add" a friend rather then having them send you a friend request, this is an instant friend
	Vanity: 1 << 3, // This is a vanity invite (like kastelapp.com/invite/kastel) Undeleatable 1 per guild
};

const publicFlags = {
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

const privateFlags = {
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

const permissions = {
	Administrator: {
		int: 1n << 0n,
		group: "role", // ? Groups = role, channel, both. role = Permissions only supported for a role (and not a channel permission override) channel = Permissions only supported for a channel (and not a role) both = Permissions supported for both
		subPermissions: {} // ? It has them all already
	},
	Guild: {
		int: 1n << 1n,
		group: "role",
		subPermissions: {
			ServerName: 1n << 0n,
			ServerDescription: 1n << 1n,
			ServerIcon: 1n << 2n,
			MaintenanceToggle: 1n << 3n,
			AddBots: 1n << 4n,
			ViewAuditLog: 1n << 5n,
			ManageVanity: 1n << 6n,
		}
	},
	Roles: {
		int: 1n << 2n,
		group: "role",
		subPermissions: {
			RoleName: 1n << 0n,
			RoleColor: 1n << 1n,
			RolePosition: 1n << 2n,
			RolePermissions: 1n << 3n,
			GrantOtherRoles: 1n << 4n, // ? If you can give other users roles
		}
	},
	Channels: {
		int: 1n << 3n,
		group: "both",
		subPermissions: {
			ChannelName: 1n << 0n,
			ChannelPosition: 1n << 1n,
			ChannelTopic: 1n << 2n,
			ChannelSlowmode: 1n << 3n, // ? This doesn't count for the per role slowmode, rather for global
			ChannelAgeRestriction: 1n << 4n,
			ChannelInvites: 1n << 5n, // ? If you can view / delete invites
			ChannelWebhooks: 1n << 6n, // ? If you can view / delete webhooks
			ChannelParent: 1n << 7n, // ? lets you manage the parent of the channel
			ChannelPermissionOverrides: 1n << 8n, // ? lets you manage permission overrides
			DeleteChannel: 1n << 9n, // ? If you can delete channels (or the channel (permission override))
			ViewChannels: 1n << 10n,
			ViewMessageHistory: 1n << 11n,
			SendMessages: 1n << 12n,
			EmbedLinks: 1n << 13n,
			AttachFiles: 1n << 14n,
			AddReactions: 1n << 15n,
			UseExternalEmojis: 1n << 17n,
			UseChatFormatting: 1n << 18n, // ? i.e markdown, and default emojis
			ManageMessages: 1n << 19n,
			BypassSlowmode: 1n << 20n,
		}
	},
	Members: {
		int: 1n << 4n,
		group: "role",
		subPermissions: {
			MemberNickname: 1n << 0n,
			MemberRoles: 1n << 1n,
			MemberDeafen: 1n << 5n,
			MemberMove: 1n << 6n,
			MemberVoice: 1n << 7n,
		}
	},
	Emojis: {
		int: 1n << 5n,
		group: "role",
		subPermissions: {
			EmojiName: 1n << 0n,
			EmojiImage: 1n << 1n,
			UploadEmoji: 1n << 2n,
			DeleteEmoji: 1n << 3n,
		}
	},
	Moderation: {
		int: 1n << 6n,
		group: "role",
		subPermissions: {
			BanMembers: 1n << 0n,
			UnbanMembers: 1n << 1n,
			ViewBans: 1n << 2n,
			KickMembers: 1n << 3n,
			TimeoutMembers: 1n << 4n,
		}
	},
	ManageNicknames: {
		int: 1n << 7n,
		group: "role",
		subPermissions: {
			Nickname: 1n << 0n, // ? you can change your own nickname
			ChangeNickname: 1n << 1n, // ? you can change other peoples nicknames
		}
	},
	ManageInvites: {
		int: 1n << 8n,
		group: "role",
		subPermissions: {
			CreateInvite: 1n << 0n,
			DeleteInvite: 1n << 1n,
			ViewInvites: 1n << 2n,
		}
	}
} satisfies {
	[key: string]: {
		group: "both" | "channel" | "role";
		int: bigint;
		subPermissions: {
			[key: string]: bigint;
		};
	};
};

const relationshipFlags = {
	None: 0,
	Blocked: 1,
	FriendRequest: 2,
	Friend: 3,
	MutualFriend: 4,
};

const auditLogActions = {};

const relative = {
	Version: version,
};

const verificationFlags = {
	VerifyEmail: 1,
	ForgotPassword: 2,
	ChangeEmail: 3,
};

const snowflake = {
	Epoch: 1_701_410_400_000n,
	TimeShift: 22n,
	WorkerIdBytes: 17n,
	ProcessIdBytes: 12n,
	WorkerId: 1n,
	ProcessId: 1n,
};

const permissionOverrideTypes = {
	Role: 1 << 0,
	Member: 1 << 1,
	Everyone: 1 << 2,
};

export default {
	settings,
	allowedMentions,
	channelTypes,
	presenceTypes,
	privateFlags,
	permissions,
	relationshipFlags,
	auditLogActions,
	relative,
	guildMemberFlags,
	messageFlags,
	verificationFlags,
	snowflake,
	publicFlags,
	guildFeatures,
	permissionOverrideTypes,
	inviteFlags,
	statusTypes
};

export {
	settings,
	allowedMentions,
	channelTypes,
	presenceTypes,
	privateFlags,
	permissions,
	relationshipFlags,
	auditLogActions,
	relative,
	guildMemberFlags,
	messageFlags,
	verificationFlags,
	snowflake,
	publicFlags,
	guildFeatures,
	permissionOverrideTypes,
	inviteFlags,
	statusTypes
};
