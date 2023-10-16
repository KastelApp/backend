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
import User from '../../../../../Middleware/User.ts';
import type App from '../../../../../Utils/Classes/App';
import ErrorGen from '../../../../../Utils/Classes/ErrorGen.ts';
import Route from '../../../../../Utils/Classes/Route.ts';
import type { MainObject } from '../../../../../Utils/Cql/Types/Message.ts';
import { T } from '../../../../../Utils/TypeCheck.ts';
import { ValidateEmbed } from '../../../../../Utils/Versioning/v1/ValidateEmbed.ts';

interface Message {
	AllowedMentions: number;
	Attachments: string[];
	Content: string;
	Embeds: MainObject[];
	Flags: number;
	Nonce: string;
	ReplyingTo: string;
}

export default class FetchAndCreateMessages extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ['GET', 'POST'];

		this.Middleware = [
			User({
				AccessType: 'LoggedIn',
				AllowedRequesters: 'User',
				App,
			}),
		];

		this.AllowedContentTypes = ['application/json'];

		this.Routes = ['/'];
	}

	public override async Request(Req: Request<{ channelId: string }>, Res: Response): Promise<void> {
		switch (Req.methodi) {
			case 'GET': {
				await this.FetchMessagesGet(Req, Res);

				break;
			}

			case 'POST': {
				await this.CreateMessagePost(Req, Res);

				break;
			}

			default: {
				Req.fourohfourit();

				break;
			}
		}
	}

	private async FetchMessagesGet(Request: Request, Res: Response): Promise<void> {}

	private async CreateMessagePost(Request: Request<{ channelId: string }, any, Message>, Res: Response): Promise<void> {
		const {
			AllowedMentions,
			// Attachments,
			Content,
			Embeds,
			Flags,
			Nonce,
			ReplyingTo,
		} = Request.body;

		const InvalidRequest = ErrorGen.InvalidField();

		if (AllowedMentions && !T(AllowedMentions, 'number')) {
			InvalidRequest.AddError({
				AllowedMentions: {
					Code: 'InvalidAllowedMentions',
					Message: 'AllowedMentions is not a number',
				},
			});
		}

		if ((!T(Content, 'string') && !Embeds) || Embeds?.length === 0) {
			InvalidRequest.AddError({
				Content: {
					Code: 'InvalidMessage',
					Message: 'You cannot send an empty message',
				},
			});
		}

		if (Flags && !T(Flags, 'number')) {
			InvalidRequest.AddError({
				Flags: {
					Code: 'InvalidFlags',
					Message: 'Flags is not a number',
				},
			});
		}

		if (Nonce && (!T(Nonce, 'string') || !this.App.Snowflake.Validate(Nonce))) {
			InvalidRequest.AddError({
				Nonce: {
					Code: 'InvalidNonce',
					Message: 'Nonce is not a valid snowflake',
				},
			});
		}

		if (ReplyingTo && (!T(ReplyingTo, 'string') || !this.App.Snowflake.Validate(ReplyingTo))) {
			InvalidRequest.AddError({
				ReplyingTo: {
					Code: 'InvalidReplyingTo',
					Message: 'ReplyingTo is not a valid snowflake',
				},
			});
		}

		if (Embeds) {
			const Errors: {
				Errors: {
					[error: string]:
						| {
								[error: string]: {
									Code: string;
									Message: string;
								};
						  }
						| {
								Code: string;
								Message: string;
						  };
				};
				Index: number;
			}[] = [];

			for (const Embed of Embeds) {
				const ValidatedEmbed = ValidateEmbed(Embed);

				if (!ValidatedEmbed.Valid) {
					const Error: {
						Errors: {
							[error: string]:
								| {
										[error: string]: {
											Code: string;
											Message: string;
										};
								  }
								| {
										Code: string;
										Message: string;
								  };
						};
						Index: number;
					} = {
						Index: Embeds.indexOf(Embed),
						Errors: {},
					};

					for (const EmbedError of ValidatedEmbed.Error) {
						if (EmbedError.Field.includes('.')) {
							const [Field, SubField] = EmbedError.Field.split('.');

							if (!Field || !SubField) continue;

							if (!Error.Errors[Field]) {
								Error.Errors[Field] = {
									Code: '',
									Message: '',
								};
							}

							// @ts-expect-error -- Too lazy to fix
							Error.Errors[Field][SubField] = {
								Code: EmbedError.Code,
								Message: EmbedError.Message,
							};
						} else {
							Error.Errors[EmbedError.Field] = {
								Code: EmbedError.Code,
								Message: EmbedError.Message,
							};
						}
					}

					Errors.push(Error);
				}
			}

			if (Errors.length > 0) {
				InvalidRequest.AddError({
					Embeds: Errors.map((Error) => ({
						[Error.Index]: Error.Errors,
					})).reduce((acc, cur) => {
						return {
							...acc,
							...cur,
						};
					}),
				});
			}
		}

		if (Flags !== this.App.Constants.MessageFlags.Normal) {
			InvalidRequest.AddError({
				Flags: {
					Code: 'InvalidFlags',
					Message: 'Flags is not a valid flag',
				},
			});
		}

		if (Object.keys(InvalidRequest.Errors).length > 0) {
			Res.status(400).send(InvalidRequest.toJSON());

			return;
		}

		console.log('You made it this far, gg');
	}
}
