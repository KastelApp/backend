interface Ban {
    _id: string;
    Guild: string;
    User: string;
    Banner: string;
    Reason: string;
    BannedDate: number;
    UnbanDate: number;
  }
  
  interface Channel {
    _id: string;
    Guild: string;
    Name: string;
    Description: string;
    Type: number;
    Nsfw: boolean;
    AllowedMentions: number;
    Parent: string;
    Children: string[];
    Position: number;
    PermissionsOverides: string[];
  }
  
  interface Emoji {
    _id: string;
    Guild: string;
    Creator: string;
    Name: string;
    EmojiHash: string;
    Disabled: boolean;
    Public: boolean;
  }
  
  interface Guild {
    _id: string;
    Name: string;
    Description: string;
    Flags: number;
    Owner: string;
    CoOwners: string[];
    Channels: string[];
    Roles: string[];
    Invites: string[];
    Bans: string[];
    Members: string[];
    Emojis: string[];
    MaxMembers: number;
  }
  
  interface GuildMember {
    _id: string;
    Guild: string;
    User: string;
    Roles: string[];
    Nickname: string;
    JoinedAt: number;
    Flags: number;
  }
  
  interface Invite {
    _id: string;
    Guild: string;
    Expires: Date;
    Uses: number;
    MaxUses: number;
    Creator: string;
    Deleteable: boolean;
  }
  
  interface PermissionsOverides {
    _id: string;
    Allow: string;
    Deny: string;
    Type: string;
    Editable: boolean;
  }
  
  interface Role {
    _id: string;
    Guild: string;
    Name: string;
    AllowedNsfw: boolean;
    Deleteable: boolean;
    AllowedMentions: number;
    Hoisted: boolean;
    Color: number;
    Permissions: string;
    Position: number;
  }
  
  interface Webhook {
    _id: string;
    Guild: string;
    Channel: string;
    Username: string;
    Token: string;
    AllowedMentions: number;
  }
  
  interface File {
    _id: string;
    Message: string;
    Name: string;
    CdnToken: string;
    Type: string;
    Deleted: boolean;
  }
  
  interface Settings {
    User: string;
    Status: string;
    Presence: number;
    Tokens: string[];
    Theme: string;
    Language: string;
    Privacy: number;
    Mentions: { Message: string }[];
  }
  
  interface Dm {
    _id: string;
    Creator: string;
    Receiver: string;
  }
  
  interface User {
    _id: string;
    Email: string;
    EmailVerified: boolean;
    Username: string;
    Tag: string;
    AvatarHash: string;
    Password: string;
    PhoneNumber: string;
    TwoFa: boolean;
    TwoFaVerified: boolean;
    TwoFaSecret: string;
    Ips: string[];
    Flags: number;
    Guilds: string[];
    Dms: string[];
    GroupChats: string[];
    Bots: string[];
    Banned: boolean;
    BanReason: string;
    Locked: boolean;
    AccountDeletionInProgress: boolean;
  }
  
  interface GroupChat {
    _id: string;
    Users: string[];
    Owner: string;
  }
  
  interface Friend {
      Sender: string;
      Receiver: string;
      SenderNickname: string;
      ReceiverNickname: string;
      Flags: number;
  }
  
  interface Message {
      _id: string;
      Author: string;
      Content: string;
      AllowedMentions: number;
      CreatedDate: number;
      UpdatedDate: number;
      Channel: string;
  }
  
  export {
      Ban,
      Channel,
      Emoji,
      Guild,
      GuildMember,
      Invite,
      PermissionsOverides,
      Role,
      Webhook,
      File,
      Settings,
      Dm,
      User,
      GroupChat,
      Friend,
      Message
  }