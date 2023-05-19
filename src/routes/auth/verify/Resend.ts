import { Route } from '@kastelll/core';
import { HTTPErrors } from '@kastelll/util';
import Config from '../../../Config.js';
import Constants, { VerificationFlags } from '../../../Constants.js';
import Captcha from '../../../Middleware/Captcha.js';
import User from '../../../Middleware/User.js';
import EMailTemplate from '../../../Utils/Classes/EmailTemplate.js';
import Encryption from '../../../Utils/Classes/Encryption.js';
import { VerifcationLinkSchema } from '../../../Utils/Schemas/Schemas.js';

new Route(
	'/resend',
	'POST',
	[
		Captcha({
			Enabled: Constants.Settings.Captcha.ForgotPassword,
		}),
        User({
            AccessType: 'LoggedIn',
            AllowedRequesters: 'User',
            DisallowedFlags: [],
            Flags: [],
        })
	],
	async (req, res) => {

        if (req.user.EmailVerified) {
            const AlreadyVerified = new HTTPErrors(4_019);

            AlreadyVerified.AddError({
                Code: {
                    Code: 'AlreadyVerified',
                    Message: 'Your email is already verified',
                },
            });

            res.status(400).json(AlreadyVerified.toJSON());

            return;
        }
        
        await VerifcationLinkSchema.deleteMany({
            User: Encryption.encrypt(req.user.Id),
            Flags: VerificationFlags.VerifyEmail,
        });
        
        if (req.NoReply) {
			const { Code } = await req.utils.VerificationLink(
				Constants.VerificationFlags.VerifyEmail,
				Encryption.decrypt(req.user.Id),
			);

			await req.NoReply.SendEmail(
				req.user.Email,
				'Email Verification',
				undefined,
				await EMailTemplate.EmailVerification(
					req.user.Username,
					`${Config.Server.Secure ? 'https' : 'http'}://${Config.Server.Domain}/verify/${Code}`,
				),
			);
		}
        
        res.status(204).end();
	},
);
