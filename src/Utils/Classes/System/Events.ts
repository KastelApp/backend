/* eslint-disable id-length */
import type { types } from "@kastelll/cassandra-driver";
import type { ExpressUser } from "../../../Types/index.ts";
import { type MainObject } from "../../Cql/Types/Message.ts";
import type { PermissionOverride } from "../../Cql/Types/index.ts";
import { OpCodes } from "../WsUtils.ts";
import type { SystemSocket } from "./SystemSocket";

class Events {
	public SendEvents: boolean;

	public constructor(private readonly SystemSocket: SystemSocket) {
		this.SystemSocket = SystemSocket;

		this.SendEvents = true;
	}

	public MessageCreate(Message: {
		AllowedMentions: number;
		Attachments: string[];
		Author: {
			Avatar: string;
			Bot: boolean;
			Flags: string;
			Id: string;
			JoinedAt: Date;
			PublicFlags: string;
			Roles: string[];
			Tag: string;
			Username: string;
		};
		Content: string;
		Embeds: MainObject[];
		Flags: number;
		Id: string;
		Mentions: {
			Channels: string[];
			Roles: string[];
			Users: string[];
		};
		Nonce: string;
		ReplyingTo: string;
	}) {
		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(
				JSON.stringify({
					Op: OpCodes.MessageCreate,
					D: {
						Message,
					},
				}),
			);
		}

		return JSON.stringify({
			Op: OpCodes.MessageCreate,
			D: {
				Message,
			},
		});
	}

	public MessageDelete(Message: { AuthorId: string; ChannelId: string; Id: string; Timestamp: number; }) {
		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(
				JSON.stringify({
					Op: OpCodes.MessageDelete,
					D: {
						Message,
					},
				}),
			);
		}

		return JSON.stringify({
			Op: OpCodes.MessageDelete,
			D: {
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
			Op: OpCodes.MessageUpdate,
			D: {
				Message,
			},
		});

		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(StringifiedPayload);
		}

		return StringifiedPayload;
	}

	public NewSession(data: { SessionId: string; UserId: string; }) {
		const StringifiedPayload = JSON.stringify({
			Op: OpCodes.NewSession,
			D: {
				SessionId: data.SessionId,
				UserId: data.UserId,
			},
		});

		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(StringifiedPayload);
		}

		return StringifiedPayload;
	}

	public DeletedSession(data: { SessionId: string; UserId: string; }) {
		const StringifiedPayload = JSON.stringify({
			Op: OpCodes.DeleteSession,
			D: {
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
			Op: OpCodes.SelfUpdate,
			D: User,
		});

		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(StringifiedPayload);
		}

		return StringifiedPayload;
	}

	public RelationshipUpdate(Data: {
		Causer: Omit<ExpressUser, "FlagsUtil" | "Token">;
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
			Op: OpCodes.RelationshipUpdate,
			D: Data,
		});

		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(StringifiedPayload);
		}

		return StringifiedPayload;
	}

	public NewGuild(Data: {
		Channels: Record<string, string[] | boolean | number | string | null>[];
		CoOwners: never[];
		Description: string | null;
		Features: string[];
		Flags: number;
		Icon: string | null;
		Id: string;
		MaxMembers: number;
		Name: string;
		OwnerId: string;
		Roles: Record<string, types.Long | boolean | number | string>[];
	}) {
		const StringifiedPayload = JSON.stringify({
			Op: OpCodes.GuildNew,
			D: Data,
		});

		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(StringifiedPayload);
		}

		return StringifiedPayload;
	}

	public ChannelNew(Data: {
		AllowedMentions: number;
		ChannelId: string;
		Children: string[];
		Description: string;
		GuildId: string;
		Name: string;
		Nsfw: boolean;
		ParentId: string;
		PermissionsOverrides: PermissionOverride[];
		Position: number;
		Slowmode: number;
		Type: number;
	}) {
		const StringifiedPayload = JSON.stringify({
			Op: OpCodes.ChannelNew,
			D: Data,
		});

		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(StringifiedPayload);
		}

		return StringifiedPayload;
	}

	public ChannelUpdate(Data: {
		AllowedMentions: number;
		ChannelId: string;
		Children: string[];
		Description: string;
		GuildId: string;
		Name: string;
		Nsfw: boolean;
		ParentId: string;
		PermissionsOverrides: PermissionOverride[];
		Position: number;
		Slowmode: number;
		Type: number;
	}) {
		const StringifiedPayload = JSON.stringify({
			Op: OpCodes.ChannelUpdate,
			D: Data,
		});

		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(StringifiedPayload);
		}

		return StringifiedPayload;
	}

	public GuildJoin(Data: {
		GuildId: string;
		UserId: string;
	}) {
		const StringifiedPayload = JSON.stringify({
			Op: OpCodes.GuildJoin,
			D: Data,
		});

		if (this.SendEvents) {
			this.SystemSocket.Ws?.send(StringifiedPayload);
		}

		return StringifiedPayload;
	}
}

export default Events;

export { Events };
