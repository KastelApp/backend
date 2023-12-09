import type { NextFunction, Request, Response } from "express";
import type App from "./App";

type ExpressMethod = "all" | "delete" | "get" | "head" | "options" | "patch" | "post" | "put";

type ContentTypes =
	| "application/javascript"
	| "application/json"
	| "application/octet-stream"
	| "application/pdf"
	| "application/vnd.ms-excel"
	| "application/vnd.ms-fontobject"
	| "application/vnd.ms-powerpoint"
	| "application/vnd.openxmlformats-officedocument.presentationml.presentation"
	| "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	| "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	| "application/x-7z-compressed"
	| "application/x-apple-diskimage"
	| "application/x-bzip2"
	| "application/x-font-ttf"
	| "application/x-rar-compressed"
	| "application/x-shockwave-flash"
	| "application/x-tar"
	| "application/x-www-form-urlencoded"
	| "application/xml"
	| "application/zip"
	| "audio/mpeg"
	| "audio/ogg"
	| "audio/wav"
	| "audio/webm"
	| "font/eot"
	| "font/otf"
	| "font/ttf"
	| "font/woff"
	| "font/woff2"
	| "image/gif"
	| "image/jpeg"
	| "image/png"
	| "image/svg+xml"
	| "image/webp"
	| "image/x-icon"
	| "multipart/form-data"
	| "text/html"
	| "text/plain"
	| "text/xml"
	| "video/mp4"
	| "video/ogg"
	| "video/quicktime"
	| "video/webm"
	| "video/x-flv"
	| "video/x-matroska"
	| "video/x-ms-wmv"
	| "video/x-msvideo";

type Methods =
	| "ALL"
	| "all"
	| "DELETE"
	| "delete"
	| "GET"
	| "get"
	| "HEAD"
	| "head"
	| "OPTIONS"
	| "options"
	| "PATCH"
	| "patch"
	| "POST"
	| "post"
	| "PURGE"
	| "purge"
	| "PUT"
	| "put";

class Route {
	public readonly App: App;

	public Methods: Methods[];

	public Middleware: ((req: Request, res: Response, next: NextFunction) => void)[];

	public AllowedContentTypes: ContentTypes[];

	public Routes: string[];

	public KillSwitched: boolean; // KillSwitched routes will be populated in the routes, though when someone tries to use it, we'll return a 503 error (default is false)

	public constructor(App: App) {
		this.App = App;

		this.Methods = ["GET"];

		this.Middleware = [];

		this.AllowedContentTypes = [];

		this.Routes = [];

		this.KillSwitched = false;
	}

	public PreRun(Req: Request, Res: Response): boolean {
		if (Req || Res) {
			// Not implemented
		}

		return true;
	}

	public Request(Req: Request, Res: Response) {
		if (this.App || Req || Res) {
			// Not implemented
		}
	}

	public Finish(Res: Response, Status: number, Data: Date) {
		if (this.App || Res || Status || Data) {
			// Not implemented
		}
	}
}

export default Route;

export type { Route, Methods, ExpressMethod, ContentTypes };
