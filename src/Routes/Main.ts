/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import type { Request, Response } from "express";
import type App from "../Utils/Classes/App";
import Route from "../Utils/Classes/Route.ts";

export default class Main extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ["GET"];

		this.Middleware = [];

		this.AllowedContentTypes = [];

		this.Routes = ["/"];
	}

	public override Request(_: Request, Res: Response): void {
		Res.send("ok");
	}
}
