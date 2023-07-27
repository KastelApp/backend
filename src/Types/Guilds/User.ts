interface RawGuildMember {
	Flags: number;
	Guild: string;
	JoinedAt: number;
	Roles: string[];
	User?: RawUser;
	__v: number;
	_id: string;
}

interface RawChannel {
	AllowedMentions: number;
	Children: string[];
	Description: string;
	Guild: string;
	Name: string;
	Parent: string;
	PermissionsOverides: any[];
	Position: number;
	Type: number;
	__v: number;
	_id: string;
}

interface RawRole {
	AllowedMentions: number;
	Deleteable: boolean;
	Guild: string;
	Hoisted: boolean;
	Name: string;
	Permissions: string;
	Position: number;
	__v: number;
	_id: string;
}

interface RawUser {
	AccountDeletionInProgress: boolean;
	AvatarHash: null;
	BanReason: null;
	Banned: boolean;
	Bots: any[];
	Dms: any[];
	Email: string;
	EmailVerified: boolean;
	Flags: number;
	GroupChats: any[];
	Guilds: string[];
	Ips: any[];
	Locked: boolean;
	Password: string;
	PhoneNumber: null;
	Tag: string;
	TwoFa: boolean;
	TwoFaSecret: null;
	TwoFaVerified: boolean;
	Username: string;
	__v: number;
	_id: string;
}

export interface GuildPermissions {
	Bans: string[];
	Channels?: RawChannel[];
	CoOwners: string[];
	Description: string;
	Emojis: string[];
	Flags: number;
	Invites: string[];
	MaxMembers: number;
	Members?: RawGuildMember[];
	Name: string;
	Owner: string;
	Roles?: RawRole[];
	__v: number;
	_id: string;
}
