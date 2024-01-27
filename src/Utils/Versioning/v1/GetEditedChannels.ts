import type { Channel } from "../../Cql/Types";

export const getEditedChannels = (before: Channel[], current: Channel[]) => {
	const changedChannels = [];

	for (const channel of current) {
		const beforeChannel = before.find((BeforeChannel) => BeforeChannel.channelId === channel.channelId);

		if (!beforeChannel) {
			changedChannels.push(channel);

			continue;
		}

		if (Bun.deepEquals(channel, beforeChannel)) continue;

		changedChannels.push(channel);
	}

	return changedChannels;
};
