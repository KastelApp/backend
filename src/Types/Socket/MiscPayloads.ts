export interface AuthedPayload {
	ApproximateMembers: number;
	Authed: boolean;
	Misc: {
		HeartbeatInterval: number | null;
		SessionId: string;
	};
	S: number;
}

export interface NormalPayload {
	D?: any;
	Op: number; // data
	S?: number; // sequence
}
