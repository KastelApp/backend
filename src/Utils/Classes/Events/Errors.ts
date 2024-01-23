const errorCodes = {
	unknownError: {
		code: 4_000,
		reason: "Unknown error occurred.",
		reconnect: true, // ? you can try to reconnect, doesn't mean it will always work
	},
	invalidToken: {
		code: 4_001,
		reason: "Invalid token provided.",
		reconnect: false, // ? you cannot reconnect after this (i.e you can't resume the session)
	},
	accountUnAvailable: {
		code: 4_002,
		reason: "Account is unavailable.",
		reconnect: false,
	},
	invalidOpCode: {
		code: 4_003,
		reason: "You sent an opcode that is invalid or is not client-sendable.", // ? client sendable means that the client cannot send this opcode
		reconnect: true,
	},
	invalidPayload: {
		code: 4_004,
		reason: "You sent a payload that is invalid.",
		reconnect: true,
	},
	internalServerError: {
		code: 5_000,
		reason: "Internal server error :(",
		reconnect: false,
	},
};

export { errorCodes };
