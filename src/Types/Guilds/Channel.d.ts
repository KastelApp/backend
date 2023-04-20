export interface Channel {
    _id: string;
    Guild: string;
    Name: string;
    Description?: string;
    Type: number;
    Nsfw?: boolean;
    AllowedMentions?: number;
    Parent?: string;
    Children?: string[];
    Position: number;
    Permissions: number;
}