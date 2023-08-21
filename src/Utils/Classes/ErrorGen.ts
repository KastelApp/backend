import { HTTPErrors } from '@kastelll/util';

const ErrorGen = {
	InvalidContentType: () => {
		return new HTTPErrors(4_000);
	},
	MissingAuthField: () => {
		return new HTTPErrors(4_001);
	},
	FailedToRegister: () => {
		return new HTTPErrors(4_002);
	},
	AccountNotAvailable: () => {
		return new HTTPErrors(4_003);
	},
	NotFound: () => {
		return new HTTPErrors(4_004);
	},
	InvalidCredentials: () => {
		return new HTTPErrors(4_005);
	},
	UnAuthorized: () => {
		return new HTTPErrors(4_006);
	},
	RateLimited: () => {
		return new HTTPErrors(4_007);
	},
	InvalidSession: () => {
		return new HTTPErrors(4_008);
	},
	FailedToPatchUser: () => {
		return new HTTPErrors(4_009);
	},
	FailedToDisableOrDeleteSelf: () => {
		return new HTTPErrors(4_010);
	},
	LimitReached: () => {
		return new HTTPErrors(4_011);
	},
	MissingField: () => {
		return new HTTPErrors(4_012);
	},
	IssueWithFriend: () => {
		return new HTTPErrors(4_013);
	},
	InvalidUser: () => {
		return new HTTPErrors(4_014);
	},
	InvalidSnowflake: () => {
		return new HTTPErrors(4_015);
	},
	UnknownGuild: () => {
		return new HTTPErrors(4_016);
	},
	FailedToCreateChannel: () => {
		return new HTTPErrors(4_017);
	},
	MissingPermissions: () => {
		return new HTTPErrors(4_018);
	}
};

export default ErrorGen;

export { ErrorGen };
