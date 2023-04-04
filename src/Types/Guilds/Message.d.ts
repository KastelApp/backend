interface Author {
    Id: string;
    User: {
        Id: string;
        Username: string;
        Tag: string;
        AvatarHash: string;
        PublicFlags: number;
    };
    Roles: string[];
    Nickname: string;
    JoinedAt: number;
}

export interface PopulatedMessage {
    Id: string;
    Author: Author
    Content: string;
    AllowedMentions: number;
    CreatedAt: number;
    UpdatedAt: number;
    Flags: number;
    Nonce: string;
}