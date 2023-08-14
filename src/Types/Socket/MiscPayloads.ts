export interface AuthedPayload {
	ApproximateMembers: number;
	Authed: boolean;
	Misc: {
		HeartbeatInterval: number | null;
		SessionId: string;
	};
	s: number;
}

export interface NormalPayload {
	d?: any;
	op: number; // data
	s?: number; // sequence
}
