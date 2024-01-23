import type { Infer } from "@/Types/BodyValidation.ts";
import { enums, number, string } from "@/Types/BodyValidation.ts";
import AuthRequired from "@/Utils/Classes/Events/Decorators/AuthRequired.ts";
import Description from "@/Utils/Classes/Events/Decorators/Description.ts";
import OpCode from "@/Utils/Classes/Events/Decorators/OpCode.ts";
import Validator from "@/Utils/Classes/Events/Decorators/Validator.ts";
import Event from "@/Utils/Classes/Events/Event.ts";
import { opCodes } from "@/Utils/Classes/Events/OpCodes.ts";
import type User from "@/Utils/Classes/Events/User.ts";
import type WebSocket from "@/Utils/Classes/WebSocket.ts";

const heartbeatData = {
	seq: number(),
};

const identifyData = {
	token: string(),
	meta: {
		os: string(),
		device: enums(["desktop", "mobile", "browser"]),
		client: string().optional(), // ? client data i.e "eyJ2ZXJzaW9uIjoiMC4wLjY4IiwiY29tbWl0IjoiZmFhMzE0MyIsImJyYW5jaCI6ImRldmVsb3BtZW50In0=" which is the version, commit & branch
	},
};

export default class IdentifyAndHeartbeat extends Event {
	public constructor(App: WebSocket) {
		super(App);
	}

	@Description("Heartbeat to keep the connection alive")
	@OpCode(opCodes.heartbeat)
	@AuthRequired()
	@Validator(heartbeatData)
	public async heartbeat(user: User, data: Infer<typeof heartbeatData>) {}

	@Description("Heartbeat to keep the connection alive")
	@OpCode(opCodes.identify)
	@AuthRequired()
	@Validator(identifyData)
	public async identify(user: User, data: Infer<typeof identifyData>) {}
}
