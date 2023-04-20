export interface Role {
    _id: string;
    Guild: string;
    Name: string;
    AllowedNsfw?: boolean;
    Deleteable: boolean;
    AllowedMentions?: number;
    Hoisted?: boolean;
    Color?: number;
    Permissions: string;
    Position: number;
}