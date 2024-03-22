import Constants from "@/Constants.ts";
import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type API from "@/Utils/Classes/API.ts";
import GuildMemberFlags from "@/Utils/Classes/BitFields/GuildMember.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

export default class LeaveGuild extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("delete")
	@Description("Change this Description when working on this route")
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	public async deleteGuild({ user, params, set }: CreateRoute<"/:guildId", any, [UserMiddlewareType]>) {
		const notFound = errorGen.UnknownGuild();

		if (!user.guilds.includes(params.guildId)) {
			notFound.addError({
				guildId: {
					code: "UnknownGuild",
					message: "The provided guild does not exist, or you do not have access to it.",
				},
			});

			set.status = 404;

			return notFound.toJSON();
		}

		const guildMember = (await this.App.cassandra.models.GuildMember.get({
			guildId: Encryption.encrypt(params.guildId),
			userId: Encryption.encrypt(user.id),
			left: false
		}))!;

		if (!guildMember) {
			set.status = 500;

			return "Internal Server Error :(";
		}

		const guildMemberFlags = new GuildMemberFlags(guildMember.flags);
		const noPermission = errorGen.MissingPermissions();

		if (!guildMemberFlags.has("In")) {
			notFound.addError({
				guildId: {
					code: "UnknownGuild",
					message: "The provided guild does not exist, or you do not have access to it.",
				},
			});

			set.status = 404;

			return notFound.toJSON();
		}

		if (guildMemberFlags.has("Owner")) {
			noPermission.addError({
				guildId: {
					code: "MissingPermissions",
					message: "You do not have permission to leave this guild.",
					requiredPermissions: [],
				},
			});

			set.status = 403;

			return noPermission.toJSON();
		}

		await this.App.cassandra.models.GuildMember.update({
			guildId: Encryption.encrypt(params.guildId),
			userId: Encryption.encrypt(user.id),
			flags: Constants.guildMemberFlags.Left,
			guildMemberId: guildMember.guildMemberId,
			roles: [],
			left: true
		});

		await this.App.cassandra.models.User.update({
			userId: Encryption.encrypt(user.id),
			guilds: Encryption.completeEncryption(user.guilds.filter((guild) => guild !== params.guildId)),
		});

		this.App.rabbitMQForwarder("guild.delete", {
			guildId: params.guildId,
			userId: user.id,
			self: true, // ? only send to the userId
		});

		this.App.rabbitMQForwarder("guildMember.remove", {
			guildId: params.guildId,
			userId: user.id,
		});

		set.status = 204;

		// eslint-disable-next-line sonarjs/no-redundant-jump, no-useless-return
		return;
	}
}
