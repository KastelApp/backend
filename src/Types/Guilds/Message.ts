interface Author {
	Id: string;
	JoinedAt: number;
	Nickname: string;
	Roles: string[];
	User: {
		AvatarHash: string;
		Id: string;
		PublicFlags: number;
		Tag: string;
		Username: string;
	};
}

export interface PopulatedMessage {
	AllowedMentions: number;
	Author: Author;
	Content: string;
	CreatedAt: number;
	Flags: number;
	Id: string;
	Nonce: string;
	UpdatedAt: number;
}
