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

// TODO: Add more stuff to this class

import { Request, Response } from "express";

// Description: This class is used to store user data, and to flush it to the database
// Its main purpose is for setting when someone fails a request, we then flush it to the rate limiter database
// this way our rate limiter can be dynamic and not just a static number
// failed_requests % 5 === 0 ? failed_requests / 5 : failed_requests % 5 (Example formula)

class User {
    Token: string;
    Failed: boolean;
    FailedCode: number | null;
    res: Response<any, Record<string, any>> | undefined;
    req: Request<any, any, any, any> | undefined;
    constructor(Token: string, req?: Request, res?: Response) {
        this.Token = Token;

        this.Failed = false;

        this.FailedCode = null;

        this.req = req;

        this.res = res;
   }

   flush() {
    console.log('User data written to db')

   }

   SetFailed(code: number) {
    this.Failed = true;
    this.FailedCode = code;
   }

   reply(code: number, data: any) {
    if (typeof data === "object") {
        this.res?.status(code).json(data);
    } else {
        this.res?.status(code).send(data);
    }
   }

}

export default User;

export { User };