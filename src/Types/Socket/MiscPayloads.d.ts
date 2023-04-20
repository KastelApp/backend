export interface AuthedPayload {
    Authed: boolean;
    ApproximateMembers: number;
    Misc: {
        HeartbeatInterval: number | null;
        SessionId: string
    };
    s: number;
}

export interface NormalPayload {
    op: number;
    d?: any; // data
    s?: number; // sequence
}