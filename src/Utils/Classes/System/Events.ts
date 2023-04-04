import { WsUtils } from '../WsUtils';
import {SystemSocket } from './SystemSocket'
class Events {
    SendEvents: boolean;
    constructor(
        private SystemSocket: SystemSocket
    ) {
        this.SystemSocket = SystemSocket;

        this.SendEvents = true
    }

    MessageCreate(Message: {
        Id: string;
        Author: {
            Id: string;
            User: {
                Id: string;
                AvatarHash: string | null;
                Username: string;
                Tag: string;
                PublicFlags: number;
                Flags: number;
            }
            ;
            Roles: string[];
            Nickname: string | null;
            JoinedAt: number;
        }
        Content: string;
        AllowedMentions: number;
        CreatedAt: number;
        UpdatedAt: number;
        Nonce: null;
        Flags: number;
        ChannelId: string;
    }) {
        if (this.SendEvents) {
            this.SystemSocket.Ws?.send(JSON.stringify({
                op: WsUtils.OpCodes.MessageCreate,
                d: {
                    Message
                }
            }))
        }

        return JSON.stringify({
            op: WsUtils.OpCodes.MessageCreate,
            d: {
                Message
            }
        })
    }

    MessageDelete(Message: {
        Id: string;
        ChannelId: string;
        AuthorId: string;
        Timestamp: number;
    }) {
        if (this.SendEvents) {
            this.SystemSocket.Ws?.send(JSON.stringify({
                op: WsUtils.OpCodes.MessageDelete,
                d: {
                    Message
                }
            }))
        }

        return JSON.stringify({
            op: WsUtils.OpCodes.MessageDelete,
            d: {
                Message
            }
        })
    }

    MessageUpdate(Message: {
        Id: string;
        Author: {
            Id: string;
            User: {
                Id: string;
                AvatarHash: string | null;
                Username: string;
                Tag: string;
                PublicFlags: number;
            }
            ;
            Roles: string[];
            Nickname: string | null;
            JoinedAt: number;
        }
        Content: string;
        AllowedMentions: number;
        CreatedAt: number;
        UpdatedAt: number;
        Nonce: string;
        Flags: number;
        ChannelId: string;
    }) {
        if (this.SendEvents) {
            this.SystemSocket.Ws?.send(JSON.stringify({
                op: WsUtils.OpCodes.MessageUpdate,
                d: {
                    Message
                }
            }))
        }

        return JSON.stringify({
            op: WsUtils.OpCodes.MessageUpdate,
            d: {
                Message
            }
        })
    }
}

export default Events;

export { Events };