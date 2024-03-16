export interface MessageCreate {
	channelId: string;
	message: {
		allowedMentions: number;
		attachments: any[];
		author: {
			avatar: string | null;
			flags: string;
			globalNickname: string | null;
			id: string;
			publicFlags: string;
			tag: string;
			username: string;
		};
		content: string;
		creationDate: string;
		deletable: boolean;
		editedDate: string | null;
		embeds: any[];
		flags: number;
		id: string;
		mentions: {
			channels: any[];
			roles: any[];
			users: any[];
		};
		nonce: string;
		pinned: boolean;
		replyingTo: string | null;
	};
}
