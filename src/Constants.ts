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

const Settings = {
  Max: {
    GuildCount: 50,
    ChannelCount: 250,
    RoleCount: 250,
    InviteCount: 500,
    BanCount: Infinity,
    FriendCount: 100,
    MemberCount: 500,
    UsernameLength: 32,
    // The max amount of usernames, lets say the name is "cat" there can be 9999 accounts then once we
    // hit the max nobody can switch tags, So we limit to 5k so people can switch tags
    UsernameCount: 5000
  },
  Min: {
    UsernameLength: 2,
  }
};

const AllowedMentions: {
    Everyone: number;
    Here: number;
    Roles: number;
    Users: number;
    All?: number;
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
  NoOwner: 1 << 10, // NoOwner is a rare flag, Should never be found in the wild (but it is possible)
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

const Flags = {
  Ghost: 1 << 0,
  System: 1 << 1,
  Staff: 1 << 2,
  BetaTester: 1 << 3,
  Bot: 1 << 4,
  VerifiedBot: 1 << 5,
  Spammer: 1 << 10,
  Tos: 1 << 11,
  GuildBan: 1 << 12,
  FriendBan: 1 << 13,
  GroupchatBan: 1 << 14,
  GhostBadge: 1 << 15,
  SponsorBadge: 1 << 16,
  StaffBadge: 1 << 17,
  DeveloperBadge: 1 << 18,
  VerifiedBotDeveloperBadge: 1 << 19,
  OriginalUserBadge: 1 << 20,
  PartnerBadge: 1 << 21,
  ModeratorBadge: 1 << 22,
  MinorBugHunterBadge: 1 << 23,
  IntermediateBugHunterBadge : 1 << 24,
  MajorBugHunterBadge: 1 << 25,
};

// These are BigInts since BigInt Bitfields don't loop around to One after 32 (1 << 32 loops 1 but 1n << 32n goes to 4294967296n)
const Permissions = {
  Administrator: 1n << 0n,
  ManageGuild: 1n << 1n,
  ManageRoles: 1n << 2n,
  ManageChannels: 1n << 3n,
  ManageMembers: 1n << 4n,
  ManageEmojis: 1n << 5n,
  ManageBans: 1n << 6n,
  ManageNicknames: 1n << 7n,
  ManageInvites: 1n << 8n,
  ManageMessages: 1n << 9n,
  SendMessages: 1n << 10n,
  ReadMessages: 1n << 11n,
  KickMembers: 1n << 12n,
  BanMembers: 1n << 13n,
  CreateInvites: 1n << 14n,
  ViewChannel: 1n << 15n,
  BypassSlowmode: 1n << 16n,
  ManageChannel: 1n << 17n,
  ChangeNickname: 1n << 18n,
  ManageWebhooks: 1n << 19n,
  ViewAuditLog: 1n << 20n,
};

const RelationshipFlags = {
    Blocked: 1 << 0,
    IncomingRequest: 1 << 1,
    OutgoingRequest: 1 << 2,
    Friend: 1 << 3,
    // MutualFriend: 1 << 4, // Actually this could be done client side
};

const AuditLogActions = {};

const Relative = {
  Version: "0.0.1",
}

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
};
