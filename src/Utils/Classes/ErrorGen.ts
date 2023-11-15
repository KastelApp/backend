import { HTTPErrors } from "@kastelll/util";

const ErrorGen = {
	/*
	 * When the content type does not match the allowed content types for example the routes content type is "application/json" but the request content type is "text/html"
	 */
	InvalidContentType: () => {
		return new HTTPErrors(4_000);
	},
	/*
	 * When the route requires to be logged in but the user is not logged in
	 */
	MissingAuthField: () => {
		return new HTTPErrors(4_001);
	},
	/*
	 * When something is wrong when trying to register an account
	 */
	FailedToRegister: () => {
		return new HTTPErrors(4_002);
	},
	/*
	 * When the account is disabled, deleted or in the progress of being deleted
	 */
	AccountNotAvailable: () => {
		return new HTTPErrors(4_003);
	},
	/*
	 * Requested resource was not found
	 */
	NotFound: () => {
		return new HTTPErrors(4_004);
	},
	/*
	 * The password provided was invalid
	 */
	InvalidCredentials: () => {
		return new HTTPErrors(4_005);
	},
	/*
	 * Requested resource requires a specific permission you do not have
	 */
	UnAuthorized: () => {
		return new HTTPErrors(4_006);
	},
	/*
	 * When the client is being rate limited
	 */
	RateLimited: () => {
		return new HTTPErrors(4_007);
	},
	/*
	 * The session you tried to manage is invalid (deleted, never existed etc)
	 */
	InvalidSession: () => {
		return new HTTPErrors(4_008);
	},
	/*
	 * Failed to update the user
	 */
	FailedToPatchUser: () => {
		return new HTTPErrors(4_009);
	},
	/*
	 * Failed to disable yourself / delete yourself
	 */
	FailedToDisableOrDeleteSelf: () => {
		return new HTTPErrors(4_010);
	},
	/*
	 * The limit for something has been reached (think max guilds, max friends etc)
	 */
	LimitReached: () => {
		return new HTTPErrors(4_011);
	},
	/*
	 * You are missing something that is required (think missing a field in a request) or its invalid
	 */
	InvalidField: () => {
		return new HTTPErrors(4_012);
	},
	/*
	 * There was an issue managing or adding a friend
	 */
	IssueWithFriend: () => {
		return new HTTPErrors(4_013);
	},
	/*
	 * Requested user does not exist
	 */
	InvalidUser: () => {
		return new HTTPErrors(4_014);
	},
	/*
	 * The snowflake provided is invalid
	 */
	InvalidSnowflake: () => {
		return new HTTPErrors(4_015);
	},
	/*
	 * The gulid provided is invalid (While it says Unknown, it doesn't always mean it doesn't exist, you may just not be able to retrieve data relating to it)
	 */
	UnknownGuild: () => {
		return new HTTPErrors(4_016);
	},
	/*
	 * Something happened when trying to create a channel
	 */
	FailedToCreateChannel: () => {
		return new HTTPErrors(4_017);
	},
	/*
	 * Unlike the the UnAuthorized error, this is when you are missing permissions to do something (Think OUR permissions (like ManageGuild)), the othe rone is for example the route is staff only
	 */
	MissingPermissions: () => {
		return new HTTPErrors(4_018);
	},
	/*
	 * When you failed to create an invite
	 */
	FailedToCreateInvite: () => {
		return new HTTPErrors(4_019);
	},
	/*
	 * The request was too large
	 */
	TooLarge: () => {
		return new HTTPErrors(4_020);
	},
	/*
	 * The invite provided was invalid or expired
	 */
	InvalidInvite: () => {
		return new HTTPErrors(4_021);
	},
	/*
	 * The channel provided was invalid
	 */
	UnknownChannel: () => {
		return new HTTPErrors(4_022);
	},
	/*
	 * Used when the resource is unavailable (503 error)
	 */
	ServiceUnavailable: () => {
		return new HTTPErrors(5_000);
	},
};

export default ErrorGen;

export { ErrorGen };
