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

// TODO: Emit when the guild is deleted

export default class FetchEditGuild extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("get")
	@Description("Change this Description when working on this route")
	@ContentTypes("application/json")
	public getGuild() {
		return {};
	}

	@Method("post")
	@Description("Change this Description when working on this route")
	@ContentTypes("application/json")
	public postGuild() {
		return {};
	}

	@Method("delete")
	@Description("Delete a guild")
	@ContentTypes("application/json")
	@Middleware(userMiddleware({
		AccessType: "LoggedIn",
		AllowedRequesters: "User"
	}))
	public async deleteGuild({
		user,
		params,
		set
	}: CreateRoute<"/:guildId", any, [UserMiddlewareType]>) {
		const noPermission = errorGen.MissingPermissions();
		const notFound = errorGen.UnknownGuild();

		console.log(Encryption.encrypt(params.guildId));


		if (!user.guilds.includes(params.guildId)) {
			notFound.addError({
				guildId: {
					code: "UnknownGuild",
					message: "The provided guild does not exist, or you do not have access to it."
				}
			});

			set.status = 404;

			return notFound.toJSON();
		}

		const guildMember = (await this.App.cassandra.models.GuildMember.get({ guildId: Encryption.encrypt(params.guildId), userId: Encryption.encrypt(user.id) }))!;

		if (!guildMember) {
			set.status = 500;

			return "Internal Server Error :(";
		}

		const guildMemberFlags = new GuildMemberFlags(guildMember.flags);

		if (!guildMemberFlags.has("Owner")) {
			noPermission.addError({
				guildId: {
					code: "MissingPermissions",
					message: "You do not have permission to delete this guild."
				}
			});

			set.status = 403;

			return noPermission.toJSON();
		}

		// ? why aren't we using the models here?
		await this.App.cassandra.execute("DELETE FROM channels WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);
		await this.App.cassandra.execute("DELETE FROM guild_members WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);
		await this.App.cassandra.execute("DELETE FROM emojis WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);
		await this.App.cassandra.execute("DELETE FROM invites WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);
		await this.App.cassandra.execute("DELETE FROM roles WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);
		await this.App.cassandra.execute("DELETE FROM webhooks WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);
		await this.App.cassandra.execute("DELETE FROM bans WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);
		await this.App.cassandra.execute("DELETE FROM guilds WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);

		await this.App.cassandra.models.User.update({
			userId: Encryption.encrypt(user.id),
			guilds: Encryption.completeEncryption(user.guilds.filter((guild) => guild !== params.guildId))
		});

		set.status = 204;

		this.App.rabbitMQForwarder("guild.delete", {
			guildId: params.guildId
		});

		// eslint-disable-next-line sonarjs/no-redundant-jump, no-useless-return
		return;
	}
}
