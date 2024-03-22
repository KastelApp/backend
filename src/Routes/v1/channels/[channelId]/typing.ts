import Constants from "@/Constants.ts";
import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type API from "@/Utils/Classes/API.ts";
import GuildMemberFlags from "@/Utils/Classes/BitFields/GuildMember.ts";
import { FlagUtils } from "@/Utils/Classes/BitFields/NewFlags.ts";
import Permissions from "@/Utils/Classes/BitFields/Permissions.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";
import type PermissionsOverrides from "@/Utils/Cql/Types/PermissionsOverides.ts";
import type Roles from "@/Utils/Cql/Types/Role.ts";
import PermissionHandler from "@/Utils/Versioning/v1/PermissionCheck.ts";

export default class Typing extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("post")
	@Description(
		"Tell other clients when you are typing, clients should send this every 10 seconds, it should also last for 15 seconds",
	)
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	public async sendTyping({ params, set, user }: CreateRoute<"/channels/:channelId", any, [UserMiddlewareType]>) {
		const channel = await this.App.cassandra.models.Channel.get({
			channelId: Encryption.encrypt(params.channelId),
		});

		const unknownChannel = errorGen.UnknownChannel();

		if (!channel) {
			set.status = 404;

			unknownChannel.addError({
				channel: {
					code: "UnknownChannel",
					message: "The provided channel does not exist or you do not have access to it.",
				},
			});

			return unknownChannel.toJSON();
		}

		const channelFlags = new FlagUtils(channel.type, Constants.channelTypes);

		if (channelFlags.hasOneArray(["Dm", "GroupChat"])) {
			// todo: other logic here later

			set.status = 500;

			return "Internal Server Error :(";
		} else {
			const guildMember = await this.App.cassandra.models.GuildMember.get({
				guildId: channel.guildId!,
				userId: Encryption.encrypt(user.id),
				left: false
			});

			if (!guildMember) {
				set.status = 500;

				return "Internal Server Error :(";
			}

			const guildMemberFlags = new GuildMemberFlags(guildMember.flags);

			if (!guildMemberFlags.has("In")) {
				set.status = 404;

				unknownChannel.addError({
					channel: {
						code: "UnknownChannel",
						message: "The provided channel does not exist or you do not have access to it.",
					},
				});

				return unknownChannel.toJSON();
			}

			const permissionOverrides = channel.permissionOverrides
				? ((
						await Promise.all(
							// eslint-disable-next-line @typescript-eslint/promise-function-async
							channel.permissionOverrides.map((id) =>
								this.App.cassandra.models.PermissionOverride.get({ permissionId: id }),
							),
						)
					).filter(Boolean) as PermissionsOverrides[])
				: [];
			const roles = (
				await Promise.all(
					// eslint-disable-next-line @typescript-eslint/promise-function-async
					guildMember.roles.map((id) => this.App.cassandra.models.Role.get({ roleId: id, guildId: channel.guildId! })),
				)
			).filter(Boolean) as Roles[];

			const permissionCheck = new PermissionHandler(
				user.id,
				guildMember.flags,
				roles.map((role) => ({
					id: role.roleId,
					permissions: Permissions.permissionFromDatabase(role.permissions),
					position: role.position,
				})),
				[
					{
						id: channel.channelId,
						overrides: permissionOverrides.map((override) => ({
							allow: Permissions.permissionFromDatabase(override.allow),
							deny: Permissions.permissionFromDatabase(override.deny),
							id: override.permissionId,
							type: override.type === Constants.permissionOverrideTypes.Member ? "Member" : "Role",
						})),
					},
				],
			);

			if (!permissionCheck.hasChannelPermission(Encryption.decrypt(channel.channelId), ["SendMessages"])) {
				set.status = 403;

				const missingPermission = errorGen.MissingPermissions();

				missingPermission.addError({
					channel: {
						code: "MissingPermissions",
						message: 'You are missing the "SendMessages" permission.',
						requiredPermissions: ["SendMessages"], // ? note: this is a testing field, may be removed later
					},
				});

				return missingPermission.toJSON();
			}
		}

		set.status = 204;

		this.App.rabbitMQForwarder("message.typing", {
			channelId: params.channelId,
			userId: user.id,
		});

		// eslint-disable-next-line sonarjs/no-redundant-jump, no-useless-return
		return;
	}
}
