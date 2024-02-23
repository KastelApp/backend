export interface InviteCreate {
    channelId: string;
    code: string;
    createdAt: Date;
    creatorId: string;
    deleteable: boolean;
    expires: Date;
    guildId: string;
    maxUses: number;
    uses: number;
}

export default InviteCreate;
