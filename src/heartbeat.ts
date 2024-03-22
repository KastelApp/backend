import Logger from "@/Utils/Classes/Logger.ts";
import type { MySchema } from "./Types/JsonSchemaType.ts";
import { isConfigResponse } from "./Utils/threadMessages.ts";

declare const self: Worker;

const logger = new Logger();
let config: MySchema = {} as MySchema;

logger.who = "HTB";

const sessions: Map<string, {
    interval: number;
    lastHeartbeat: number;
}> = new Map();

self.onmessage = (event) => {
    const { data: rawData } = event;
    
    if (isConfigResponse(rawData)) {
        config = rawData.data;
        
        setInterval(() => {
            const users = Array.from(sessions.entries()).filter(([, session]) => session.lastHeartbeat !== 0 && session.lastHeartbeat + session.interval + Number(config?.ws.intervals.heartbeat.leeway) < Date.now());
        
            for (const [sessionId] of users) {
                logger.debug(`Kicking session: ${sessionId}`);
        
                self.postMessage({
                    type: "heartbeat",
                    data: {
                        event: "kick",
                        data: {
                            sessionId,
                        },
                    }
                });
        
                sessions.delete(sessionId);
            }
        }, Number(config?.ws.intervals.heartbeat.interval));
        
        
        return;
    }
    
    const { data } = rawData;

    if (data.event === "session") {
        sessions.set(data.data.sessionId, {
            interval: data.data.interval,
            lastHeartbeat: Date.now(),
        });

        logger.debug(`New session: ${data.data.sessionId}`);
    } else if (data.event === "heartbeat") {
        const session = sessions.get(data.data.sessionId);

        if (!session) return;

        session.lastHeartbeat = Date.now();

        logger.debug(`Heartbeat from ${data.data.sessionId}`);
    } else if (data.event === "left") {
        sessions.delete(data.data.sessionId);

        logger.debug(`Session left: ${data.data.sessionId}`);
    }
};

