// ! DO NOT HAE AN ERROR CODE WITH THE CODE BEING 4090 THIS IS THE "I want to disconnect but stay resumable" CODE

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
		code: 1_007,
		reason: "You sent a payload that is invalid.",
		reconnect: true,
	},
	internalServerError: {
		code: 1_011,
		reason: "Internal server error :(",
		reconnect: false,
	},
	unauthorized: {
		code: 4_004,
		reason: "You sent a payload that requires authorization, or didn't authorize in time.",
		reconnect: false,
	},
	alreadyAuthorized: {
		code: 4_005,
		reason: "You sent a payload that requires you not to be authorized.",
		reconnect: true, // ? For example, if you sent a identify payload twice, you can still reconnect
	},
	invalidSequence: {
		code: 4_006,
		reason: "You sent an invalid sequence.",
		reconnect: true,
	},
	heartbeatTimeout: {
		code: 4_007,
		reason: "You missed a heartbeat.. your heart is now dead :(.",
		reconnect: true,
	},
};

export { errorCodes };
