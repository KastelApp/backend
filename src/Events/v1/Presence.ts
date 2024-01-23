import { string, type Infer, enums } from "@/Types/BodyValidation.ts";
import AuthRequired from "@/Utils/Classes/Events/Decorators/AuthRequired.ts";
import Description from "@/Utils/Classes/Events/Decorators/Description.ts";
import OpCode from "@/Utils/Classes/Events/Decorators/OpCode.ts";
import Validator from "@/Utils/Classes/Events/Decorators/Validator.ts";
import Event from "@/Utils/Classes/Events/Event.ts";
import type User from "@/Utils/Classes/Events/User.ts";
import type WebSocket from "@/Utils/Classes/WebSocket.ts";

const presenceData = {
	// ? unsure how this will look currently :(
	customStatus: string().optional().nullable(),
	status: enums(["online", "idle", "dnd", "invisible"]).optional(),
};

export default class Presence extends Event {
	public constructor(App: WebSocket) {
		super(App);
	}

	@Description("Change your presence")
	@OpCode(1)
	@AuthRequired()
	@Validator(presenceData)
	public async presence(user: User, data: Infer<typeof presenceData>) {}
}
