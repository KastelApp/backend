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

import type { Request, Response } from 'express';
import type App from '../../../../Utils/Classes/App';
import Route from '../../../../Utils/Classes/Route.js';

export default class Channels extends Route {
    public constructor(App: App) {
        super(App);

        this.Methods = ['GET', 'POST'];

        this.Middleware = [];

        this.AllowedContentTypes = ['application/json'];

        this.Routes = ['/channels'];
    }

    public override async Request(Req: Request, Res: Response) {
        switch (Req.methodi) {
            case "GET": {
                await this.FetchChannels(Req, Res);

                break;
            }

            case "POST": {
                if (Req.path.endsWith('/fetch')) {
                    Req.fourohfourit();

                    break;
                }

                await this.PostChannels(Req, Res);

                break;
            }

            default: {
                Req.fourohfourit();

                break;
            }
        }
    }

    public async FetchChannels(Req: Request, Res: Response) { }

    public async PostChannels(Req: Request, Res: Response) { }
}
