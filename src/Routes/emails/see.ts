import { join } from "node:path";
import process from "node:process";
import { render } from "@react-email/render";
import type API from "@/Utils/Classes/API.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

const isRegisted = <T extends "BadActor" | "RecentLogin" | "Registration">(
	type: T,
	deaf: unknown,
): deaf is { default(username: string, verificationCode: string, deleteAccountUrl: string): JSX.Element } => {
	return (
		type === "Registration" &&
		typeof deaf === "object" &&
		deaf !== null &&
		"default" in deaf &&
		typeof deaf.default === "function"
	);
};

export default class Index extends Route {
	public emailDirectory: string = join(import.meta.dirname, "../../Emails");

	public constructor(App: API) {
		super(App);
	}

	@Method("get")
	@Description("Get the features of the API")
	@ContentTypes("any")
	public async Request({
		query,
		set,
	}: CreateRoute<
		"/",
		any,
		any,
		any,
		{
			deleteAccountUrl?: string;
			type: "BadActor" | "RecentLogin" | "Registration";
			username?: string;
			verificationCode?: string;
		}
	>) {
		if (process.env.NODE_ENV !== "development") {
			set.status = 404;

			return "You were lost in the maze..";
		}

		// ! removes anything like removes anything thats not A-Z, a-z and replaces it with nothing
		const cleanedType = query.type.replaceAll(/[^A-Za-z]/g, "");

		const imported = await import(`${join(this.emailDirectory, `${cleanedType}.tsx`)}?t=${Date.now()}`);

		if (!imported.default) {
			set.status = 404;

			return {
				error: {
					code: "UnknownEmail",
					message: "The email you are trying to access does not exist.",
				},
			};
		}

		if (isRegisted(query.type, imported)) {
			const rendered = render(
				imported.default(
					query.username ?? "User",
					query.verificationCode ?? "https://example.com/verify/1234567890",
					query.deleteAccountUrl ?? "https://example.com/delete/1234567890",
				),
				{
					pretty: true,
				},
			);

			set.status = 200;
			set.headers = {
				"Content-Type": "text/html",
			};

			return rendered;
		} else {
			const rendered = render(imported.default(), {
				pretty: true,
			});

			set.status = 200;

			set.headers = {
				"Content-Type": "text/html",
			};

			return rendered;
		}
	}
}
