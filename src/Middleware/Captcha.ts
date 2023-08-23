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

import { HTTPErrors } from '@kastelll/util';
import type { NextFunction, Request, Response } from 'express';
import type { Captcha as CaptchaType } from '../Types/Routes.js';

// TO DO: Cdata support

const Captcha = (options: CaptchaType) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const CaptchaHeader = req.headers['cf-turnstile-response'];

		if (!options.Enabled) {
			next();

			return;
		}

		if (
			options.Enabled &&
			options.BodyTrigger &&
			!Object.keys(req.body).some((key) => options?.BodyTrigger?.includes(key))
		) {
			next();
			return;
		}

		if (!CaptchaHeader && options.Enabled) {
			const Errors = new HTTPErrors(5_000);

			Errors.AddError({
				Captcha: {
					Code: 'MissingCaptcha',
					Message: 'You need to solve the captcha to access this endpoint',
				},
			});

			res.status(401).json(Errors.toJSON());

			return;
		}

		if (typeof CaptchaHeader !== 'string') {
			const Errors = new HTTPErrors(5_000);

			Errors.AddError({
				Captcha: {
					Code: 'InvalidCaptcha',
					Message: 'The captcha you provided is invalid',
				},
			});

			res.status(401).json(Errors.toJSON());

			return;
		}

		const VerifyCaptcha = await req.captcha.Verify(CaptchaHeader, req.ip);

		if (!VerifyCaptcha.success) {
			const Errors = new HTTPErrors(5_000);

			Errors.AddError({
				Captcha: {
					Code: 'InvalidCaptcha',
					Message: 'The captcha you provided is invalid',
				},
			});

			res.status(401).json(Errors.toJSON());

			return;
		}

		if (options.ExpectedAction && options.ExpectedAction !== VerifyCaptcha.action) {
			const Errors = new HTTPErrors(5_000);

			Errors.AddError({
				Captcha: {
					Code: 'InvalidCaptcha',
					Message: 'The captcha you provided is invalid',
				},
			});

			res.status(401).json(Errors.toJSON());

			return;
		}

		next();
	};
};

export default Captcha;

export { Captcha };
