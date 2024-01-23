import type { Channel } from "../../Cql/Types";

export const fixChannelPositions = (channel: Channel, existingChannels: Channel[], ignoreParent = false): Channel[] => {
	/* position 0 = top
	So for example four channels:
		test1 = 0
		test2 = 1
		test3 = 2
		test4 = 3
	So test1 is at the top of the channel list due to the fact its position is 0, and four is at the bottom since its 3.

	when you introduce a category it will be like:
    
		test1 = 0
		Category = 1
			-> test2 = 0
			-> test3 = 1
		test4 = 2

	overall its a tad confusing, the most confusing part might be how I handle new channels taking the position of old channels.
	So lets say "test5" is being made and the position is 1 this is how the output will be now:
    
		test1 = 0
		test5 = 1
		Category = 2
			-> test2 = 0
			-> test3 = 1
		test4 = 3

	So anything with the same position the old stuff will be moved down one which may or may not make a ton of sense idk

	BUT, If a user updates a channel in a category, we will only modify everything in that category and nothing else since a
	category has its own position system.

	WARNING: Changing how this works is API version breaking, So do not mess with this function unless it will output the same as the old one
	WARNING: You may change it on a brand new experiment API version but not on old ones nor the current latest one.
	*/

	const sortedExistingChannels = existingChannels.sort((a, b) => a.position - b.position);

	if (channel.parentId && !ignoreParent) {
		const allChannelsRelatingToParentId = sortedExistingChannels.filter((filteredChannel) => {
			return filteredChannel.parentId === channel.parentId;
		});

		const imagine = fixChannelPositions(channel, allChannelsRelatingToParentId, true);

		const filteredExistingChannels = sortedExistingChannels.filter((filteredChannel) => {
			return !imagine.some((UpdatedChannel) => UpdatedChannel.channelId === filteredChannel.channelId);
		});

		return [...filteredExistingChannels, ...imagine].sort((a, b) => a.position - b.position);
	}

	const newChannelPositionIndex = sortedExistingChannels.findIndex(
		(indexedChannel) => indexedChannel.position === channel.position,
	);

	if (newChannelPositionIndex === -1) {
		const lastPosition = sortedExistingChannels[sortedExistingChannels.length - 1]?.position ?? 0;

		return [
			...sortedExistingChannels,
			{
				...channel,
				position: lastPosition + 1,
			},
		].sort((a, b) => a.position - b.position);
	} else {
		const channelsUnderNewChannelPosition = sortedExistingChannels.filter((filteredChannel) => {
			return (
				filteredChannel.position >= channel.position &&
				(ignoreParent ? true : filteredChannel.parentId ? filteredChannel.parentId.length === 0 : true)
			);
		});

		const updatedChannels = channelsUnderNewChannelPosition.map((mappedChannel) => {
			return {
				...mappedChannel,
				position: mappedChannel.position + 1,
			};
		});

		const filteredExistingChannels = sortedExistingChannels.filter((FilteredChannel) => {
			return !updatedChannels.some((UpdatedChannel) => UpdatedChannel.channelId === FilteredChannel.channelId);
		});

		return [
			...filteredExistingChannels,
			...updatedChannels,
			{
				...channel,
				position: channel.position,
			},
		].sort((a, b) => a.position - b.position);
	}
};

export const fixChannelPositionsWithoutNewChannel = (channels: Channel[]): Channel[] => {
	const positionMap: { [parentId: string]: number } = {};

	channels.sort((a, b) => a.position - b.position);

	return channels.map((channel) => {
		if (channel.parentId) {
			if (positionMap[channel.parentId]) {
				positionMap[channel.parentId]++;
			} else {
				positionMap[channel.parentId] = 0;
			}

			channel.position = positionMap[channel.parentId] ?? 0;
		} else {
			const rootKey = "root";
			if (positionMap[rootKey]) {
				positionMap[rootKey]++;
			} else {
				positionMap[rootKey] = 0;
			}

			channel.position = positionMap[rootKey];
		}

		return channel;
	});
};
