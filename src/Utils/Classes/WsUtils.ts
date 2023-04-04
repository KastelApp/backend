import { Utils } from "@kastelll/packages/dist/Ws";

export class WsUtils extends Utils {
    static get OpCodes() {
        return {
            Auth: 1, // You send this to Identify yourself
            Authed: 2, // This gets sent to you when you are authenticated
            HeartBeat: 3, // This is a heartbeat to keep the connection alive (you send this)
            HeartBeatAck: 4, // This is a heartbeat to keep the connection alive (you get this)
            MessageCreate: 5, // This is a message being sent to a channel
            MessageDelete: 6, // This is a message being deleted from a channel
            MessageUpdate: 7, // This is a message being updated from a channel
            PurgeMessages: 8, // This is a message being purged from a channel
            ChannelDelete: 9, // This is a channel being deleted
            ChannelNew: 10, // This is a channel being created
            ChannelUpdate: 11, // This is a channel being updated
            GuildDelete: 12, // This is a guild being deleted
            GuildNew: 13, // This is a guild being created
            GuildUpdate: 14, // This is a guild being updated
            GuildRemove: 15, // This is a user being removed from a guild
            InviteDelete: 16, // This is an invite being deleted
            InviteNew: 17, // This is an invite being created
            PurgeInvites: 18, // This is an invite being purged
            RoleDelete: 19, // This is a role being deleted
            RoleNew: 20, // This is a role being created
            RoleUpdate: 21, // This is a role being updated
            MemberAdd: 22, // This is a member being added to a guild
            MemberLeave: 23, // This is a member being removed from a guild
            MemberBan: 24, // This is a member being banned from a guild
            MemberUpdate: 25, // This is a member being updated
            Resume: 26, // This is a resume request
        }
    }

    static get SystemOpCodes() {
        return {
            MessageCreateAck: 1,
            DeleteMessageAck: 2, 
            UpdateMessageAck: 3,
            PurgeMessagesAck: 4,
            DeleteChannelAck: 5,
            NewChannelAck: 6,
            UpdateChannelAck: 7,
            DeleteGuildAck: 8,
            NewGuildAck: 9,
            UpdateGuildAck: 10,
            RemoveFromGuildAck: 11,
            DeleteInviteAck: 12,
            NewInviteAck: 13,
            PurgeInvitesAck: 14,
            DeleteRoleAck: 15,
            NewRoleAck: 16,
            UpdateRoleAck: 17,
            MemberAddAck: 18,
            MemberLeaveAck: 19,
            MemberBanAck: 20,
            MemberUpdateAck: 21,
        }
    }
}