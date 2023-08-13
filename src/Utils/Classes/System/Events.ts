/* eslint-disable id-length */
import type { ExpressUser } from '../../../Types/index.js';
import { OpCodes } from '../WsUtils.js';
import type { SystemSocket } from './SystemSocket';

class Events {
	public SendEvents: boolean;

	public constructor(private readonly SystemSocket: SystemSocket) {
		this.SystemSocket = SystemSocket;

		this.SendEvents = true;
	}

	public MessageCreate(Message: {
		AllowedMentions: number;
		Author: {
			Id: string;
			JoinedAt: number;
			Nickname: string | null;
			Roles: string[];
			User: {
				AvatarHash: string | null;
				Flags: number;
				Id: string;
				PublicFlags: number;
				Tag: string;
				Username: string;
			};
		};
		ChannelId: string;
		Content: string;
		CreatedAt: number;
		Flags: number;
		Id: string;
		Nonce: null;
		UpdatedAt: number;
	}) {
		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(
				JSON.stringify({
					op: OpCodes.MessageCreate,
					d: {
						Message,
					},
				}),
			);
		}

		return JSON.stringify({
			op: OpCodes.MessageCreate,
			d: {
				Message,
			},
		});
	}

	public MessageDelete(Message: { AuthorId: string; ChannelId: string; Id: string; Timestamp: number; }) {
		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(
				JSON.stringify({
					op: OpCodes.MessageDelete,
					d: {
						Message,
					},
				}),
			);
		}

		return JSON.stringify({
			op: OpCodes.MessageDelete,
			d: {
				Message,
			},
		});
	}

	public MessageUpdate(Message: {
		AllowedMentions: number;
		Author: {
			Id: string;
			JoinedAt: number;
			Nickname: string | null;
			Roles: string[];
			User: {
				AvatarHash: string | null;
				Id: string;
				PublicFlags: number;
				Tag: string;
				Username: string;
			};
		};
		ChannelId: string;
		Content: string;
		CreatedAt: number;
		Flags: number;
		Id: string;
		Nonce: string;
		UpdatedAt: number;
	}) {
		const StringifiedPayload = JSON.stringify({
			op: OpCodes.MessageUpdate,
			d: {
				Message,
			},
		});

		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(StringifiedPayload);
		}

		return StringifiedPayload;
	}

	public NewSession(data: { SessionId: string, UserId: string; }) {
		const StringifiedPayload = JSON.stringify({
			op: OpCodes.NewSession,
			d: {
				SessionId: data.SessionId,
				UserId: data.UserId,
			},
		});

		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(StringifiedPayload);
		}

		return StringifiedPayload;
	}

	public DeletedSession(data: { SessionId: string, UserId: string; }) {
		const StringifiedPayload = JSON.stringify({
			op: OpCodes.DeleteSession,
			d: {
				SessionId: data.SessionId,
				UserId: data.UserId,
			},
		});

		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(StringifiedPayload);
		}

		return StringifiedPayload;
	}

	public UpdateUser(User: {
		Avatar: string | null;
		Bio?: string;
		Email: string;
		EmailVerified: boolean;
		GlobalNickname: string | null;
		Id: string;
		PhoneNumber: string | null;
		PublicFlags: number;
		Tag: string;
		TwoFaEnabled: boolean;
		TwoFaVerified: boolean;
		Username: string;
	}) {
		const StringifiedPayload = JSON.stringify({
			op: OpCodes.SelfUpdate,
			d: User,
		});

		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(StringifiedPayload);
		}

		return StringifiedPayload;
	}

	public RelationshipUpdate(Data: {
		Causer: Omit<ExpressUser, 'FlagsUtil' | 'Token'>;
		To: {
			Flags: number;
			User: {
				Avatar: string;
				GlobalNickname: string;
				Id: string;
				PublicFlags: number;
				Tag: string;
				Username: string;
			};
		};
	}) {
		// @ts-expect-error -- Too lazy to fix
		delete Data.Causer.Token;
		// @ts-expect-error -- Too lazy to fix
		delete Data.Causer.FlagsUtil;

		const StringifiedPayload = JSON.stringify({
			op: OpCodes.RelationshipUpdate,
			d: Data,
		});

		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(StringifiedPayload);
		}

		return StringifiedPayload;
	}
}

export default Events;

export { Events };
