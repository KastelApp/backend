import deepEqual from 'deep-equal';
import type { Channel } from '../../Cql/Types';

export const GetEditedChannels = (Before: Channel[], Current: Channel[]) => {
	const ChangedChannels = [];

	for (const Channel of Current) {
		const BeforeChannel = Before.find((BeforeChannel) => BeforeChannel.ChannelId === Channel.ChannelId);

		if (!BeforeChannel) {
			ChangedChannels.push(Channel);

			continue;
		}

		if (deepEqual(Channel, BeforeChannel)) continue;

		ChangedChannels.push(Channel);
	}

	return ChangedChannels;
};
