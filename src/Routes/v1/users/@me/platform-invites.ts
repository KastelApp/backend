import bodyValidator from "@/Middleware/BodyValidator.ts";
import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type { Infer } from "@/Types/BodyValidation.ts";
import { string } from "@/Types/BodyValidation.ts";
import type App from "@/Utils/Classes/App.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";
import inviteGenerator from "@/Utils/InviteGenerator.ts";

const createInviteBody = {
	expiresAt: string().optional()
}

const deleteInviteBody = {
	code: string()
}

export default class PlatformInvites extends Route {
	public constructor(App: App) {
		super(App);
	}

	@Method("get")
	@Description("Fetch the invites for Kastel")
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: ["User"],
		}),
	)
	public async getInvites({
		user,
	}: CreateRoute<"/platform-invites", any, [UserMiddlewareType]>) {
		const invites = (await this.App.Cassandra.Models.PlatformInvite.find({
			creatorId: Encryption.encrypt(user.id)
		})).toArray()
		
		return invites.map((inv) => ({
			code: Encryption.decrypt(inv.code),
			usedAt: inv.usedAt ?? null,
			usedBy: inv.usedById ? Encryption.decrypt(inv.usedById) : null,
			expiresAt: inv.expiresAt ?? null,
		}))
	}

	@Method("delete")
	@Description("Delete a invite")
	@ContentTypes("application/json")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: ["User"],
		}),
	)
	@Middleware(bodyValidator(deleteInviteBody))
	public async deleteInvite({
		user,
		body,
		set
	}: CreateRoute<"/platform-invites", Infer<typeof deleteInviteBody>, [UserMiddlewareType]>) {
		
		const foundInvite = await this.App.Cassandra.Models.PlatformInvite.get({
			code: Encryption.encrypt(body.code)
		})
		
		const failed = errorGen.FailedToDeleteInvite()
		
		if (!foundInvite) {
			const missingInvite = errorGen.InvalidInvite();
			
			missingInvite.addError({
				code: {
					code: "InvalidInvite",
					message: "The invite provided is invalid"
				}
			})
			
			set.status = 404;
			
			return missingInvite.toJSON();
		}
		
		if (Encryption.decrypt(foundInvite.creatorId) !== user.id) {
			failed.addError({
				code: {
					code: "InvalidInvite",
					message: "The invite provided is invalid"
				}
			})
			
			set.status = 404;
			
			return failed.toJSON();
		}
		
		await this.App.Cassandra.Models.PlatformInvite.remove({
			code: Encryption.encrypt(body.code)
		});
		
		await this.App.Cassandra.Models.Settings.update({
			userId: Encryption.encrypt(user.id),
			allowedInvites: user.settings.allowedInvites + 1
		})

		set.status = 204;
		
		// eslint-disable-next-line no-useless-return, sonarjs/no-redundant-jump
		return;
	}

	@Method("post")
	@Description("Create a new invite for Kastel")
	@ContentTypes("application/json")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: ["User"],
		}),
	)
	@Middleware(bodyValidator(createInviteBody))
	public async createInvite({
		body,
		user,
		set
	}: CreateRoute<"/platform-invites", Infer<typeof createInviteBody>, [UserMiddlewareType]>) {
		
		const error = errorGen.FailedToCreateInvite()
		
		if (user.settings.allowedInvites <= 0) {
			if (user.settings.allowedInvites < 0) this.App.Logger.error("User has negative allowed invites");
			
			error.addError({
				uses: {
					code: "MaxInvitesReached",
					message: "You have reached the maximum amount of invites you can create"
				}
			})
			
			set.status = 400;
			
			return error.toJSON();
		}
		
		const invite = [inviteGenerator(), inviteGenerator()].join("-")
		// ? expires default 24 hours, max is 7 days
		const expiresAt = body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 1_000 * 60 * 60 * 24)
		
		if (expiresAt.getTime() > Date.now() + 1_000 * 60 * 60 * 24 * 7) {
			error.addError({
				expiresAt: {
					code: "InvalidDate",
					message: "The date provided is too far in the future"
				}
			})
			
			set.status = 400;
			
			return error.toJSON();
		}
		
		await this.App.Cassandra.Models.Settings.update({
			userId: Encryption.encrypt(user.id),
			allowedInvites: user.settings.allowedInvites - 1
		})
		
		await this.App.Cassandra.Models.PlatformInvite.insert({
			code: Encryption.encrypt(invite),
			creatorId: Encryption.encrypt(user.id),
			expiresAt,
			usedAt: null,
			usedById: null
		});
		
		
		
		return {
			code: invite,
			expiresAt,
			usedAt: null,
			usedBy: null
		}
	}
}
