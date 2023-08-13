interface DmRecipients {
    Flags: number;
    UserId: string;
}

interface Dm {
    ChannelId: string;
    DmId: string;
    Flags: number;
    Recipients: DmRecipients[];
}

export default Dm;

export type { DmRecipients };
