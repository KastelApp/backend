interface Author {
    IconUrl: string;
    Name: string;
}

interface Footer {
    Text: string;
    Timestamp: Date;
}

interface Field {
    Description: string;
    Title: string;
}

interface MainObject {
    Author: Author;
    Color: string;
    Description: string;
    Fields: Field[];
    Footer: Footer;
    ImageUrl: string;
    ThumbnailUrl: string;
    Title: string;
    Url: string;
}

interface Messages {
    AllowedMentions: number;
    Attachments: string[];
    AuthorId: string;
    ChannelId: string;
    Content: string;
    Embeds: MainObject[];
    Flags: number;
    MentionChannels: string[];
    MentionRoles: string[];
    Mentions: string[];
    MessageId: string;
    Nonce: string;
    ReplyingTo: string;
    UpdatedDate: Date;
}

export default Messages;

export type { Author, Footer, Field, MainObject };
