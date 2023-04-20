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

import { Server } from '../../Config';
import { request } from 'undici';
import type { TurnstileValidationResponse } from '../../Types/Turnstile';
import IpUtils from './IpUtils';

class Turnstile {
    Enabled: boolean;
    Secret: string | null;
    VerifyURL: string;
    constructor() {

        this.Enabled = Server.CaptchaEnabled;

        this.Secret = Server.TurnstileSecret;

        this.VerifyURL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    }

    async Verify(response: string, ip?: string): Promise<TurnstileValidationResponse> {
        if (!this.Enabled) return {
            success: true,
        }

        if (!this.Secret) return {
            success: false,
            "error-codes": [
                'internal-error'
            ]
        } // if captcha is enabled but no secret is provided then return false

        const FormData = new URLSearchParams();

        FormData.append('secret', this.Secret);
        FormData.append('response', response);

        if (ip && !IpUtils.IsLocalIp(ip)) FormData.append('remoteip', ip);

        const { body } = await request(this.VerifyURL, {
            method: 'POST',
            body: FormData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        const Result: TurnstileValidationResponse = await body.json();

        return Result;
    }
}

export default Turnstile;

export { Turnstile };