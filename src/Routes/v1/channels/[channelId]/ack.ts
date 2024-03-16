import Constants from "@/Constants.ts";
import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type API from "@/Utils/Classes/API.ts";
import GuildMemberFlags from "@/Utils/Classes/BitFields/GuildMember.ts";
import { FlagUtils } from "@/Utils/Classes/BitFields/NewFlags.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

export default class Typing extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("post")
	@Description("Ack the messages in a channel")
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	public async ack({ params, set, user }: CreateRoute<"/channels/:channelId", any, [UserMiddlewareType]>) {
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
		}

		// eslint-disable-next-line sonarjs/no-redundant-jump, no-useless-return
		return;
	}
}
