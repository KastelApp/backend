interface Ban {
	BannedDate: number;
	Banner: string;
	Guild: string;
	Reason: string;
	UnbanDate: number;
	User: string;
	_id: string;
}

interface Channel {
	AllowedMentions: number;
	Children: string[];
	Description: string;
	Guild: string;
	Name: string;
	Nsfw: boolean;
	Parent: string;
	PermissionsOverides: string[];
	Position: number;
	Type: number;
	_id: string;
}

interface Emoji {
	Creator: string;
	Disabled: boolean;
	EmojiHash: string;
	Guild: string;
	Name: string;
	Public: boolean;
	_id: string;
}

interface Guild {
	Bans: string[];
	Channels: string[];
	CoOwners: string[];
	Description: string;
	Emojis: string[];
	Flags: number;
	Invites: string[];
	MaxMembers: number;
	Members: string[];
	Name: string;
	Owner: string;
	Roles: string[];
	_id: string;
}

interface GuildMember {
	Flags: number;
	Guild: string;
	JoinedAt: number;
	Nickname: string;
	Roles: string[];
	User: string;
	_id: string;
}

interface Invite {
	Creator: string;
	Deleteable: boolean;
	Expires: Date;
	Guild: string;
	MaxUses: number;
	Uses: number;
	_id: string;
}

interface PermissionsOverides {
	Allow: string;
	Deny: string;
	Editable: boolean;
	Type: string;
	_id: string;
}

interface Role {
	AllowedMentions: number;
	AllowedNsfw: boolean;
	Color: number;
	Deleteable: boolean;
	Guild: string;
	Hoisted: boolean;
	Name: string;
	Permissions: string;
	Position: number;
	_id: string;
}

interface Webhook {
	AllowedMentions: number;
	Channel: string;
	Guild: string;
	Token: string;
	Username: string;
	_id: string;
}

interface File {
	CdnToken: string;
	Deleted: boolean;
	Message: string;
	Name: string;
	Type: string;
	_id: string;
}

interface Settings {
	Language: string;
	Mentions: { Message: string }[];
	Presence: number;
	Privacy: number;
	Status: string;
	Theme: string;
	Tokens: string[];
	User: string;
}

interface Dm {
	Creator: string;
	Receiver: string;
	_id: string;
}

interface User {
	AccountDeletionInProgress: boolean;
	AvatarHash: string;
	BanReason: string;
	Banned: boolean;
	Bots: string[];
	Dms: string[];
	Email: string;
	EmailVerified: boolean;
	Flags: number;
	GroupChats: string[];
	Guilds: string[];
	Ips: string[];
	Locked: boolean;
	Password: string;
	PhoneNumber: string;
	Tag: string;
	TwoFa: boolean;
	TwoFaSecret: string;
	TwoFaVerified: boolean;
	Username: string;
	_id: string;
}

interface GroupChat {
	Owner: string;
	Users: string[];
	_id: string;
}

interface Friend {
	Flags: number;
	Receiver: string;
	ReceiverNickname: string;
	Sender: string;
	SenderNickname: string;
}

interface Message {
	AllowedMentions: number;
	Author: string;
	Channel: string;
	Content: string;
	CreatedDate: number;
	Embeds: {
		Color?: number;
		Description?: string;
		Fields?: {
			Title: string;
			Value: string;
		}[];
		Footer?: {
			Text: string;
		}[];
		Timestamp?: number;
		Title?: string;
	}[];
	Files: string[];
	Flags: number;
	Nonce: string;
	UpdatedDate: number;
	_id: string;
}

export type {
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
	Message,
};
