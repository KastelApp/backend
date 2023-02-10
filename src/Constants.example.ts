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
      UsernameCount: 5000,
      GuildNameLength: 100,
      GuildDescriptionLength: 500,
      GuildLimit: 100, // The amount they can request in the /guilds/fetch route
    },
    Min: {
      UsernameLength: 2,
      GuildNameLength: 2,
    },
    Captcha: { // The routes that have captcha (If you want them to have captcha)
      Login: false,
      Register: false,
      ForgotPassword: false,
      ChangePassword: false,
      ChangeEmail: false,
    },
    DisallowedWords: { // can be strings or regex (in arrays)
      Username: [],
      Guilds: [],
      Channels: [],
      Global: []
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
  
  const GuildMemberFlags = {
    Left: 1 << 0, // If they left the guild
    In: 1 << 1, // If they are in the guild
    Kicked: 1 << 2, // If they were kicked from the guild
    Banned: 1 << 3, // If they were banned from the guild
    Owner: 1 << 4, // If they are the owner of the guild
    CoOwner: 1 << 5, // If they are a co-owner of the guild (Pretty much the same as Owner but they can't delete the guild (or change the owner)))
  }
  
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
    StaffBadge: 1n << 0n,
    GhostBadge: 1n << 1n,
    SponsorBadge: 1n << 2n,
    DeveloperBadge: 1n << 3n,
    VerifiedBotDeveloperBadge: 1n << 4n,
    OriginalUserBadge: 1n << 5n,
    PartnerBadge: 1n << 6n,
    ModeratorBadge: 1n << 7n,
    MinorBugHunterBadge: 1n << 8n,
    IntermediateBugHunterBadge : 1n << 9n,
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
      FriendRequest: 1 << 1,
      Friend: 1 << 2,
      Denied: 1 << 3,
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
      GuildMemberFlags,
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
  };
  