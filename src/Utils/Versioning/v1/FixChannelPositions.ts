import type { Channel } from "../../Cql/Types";

export const FixChannelPositions = (Channel: Channel, ExistingChannels: Channel[], IgnoreParent = false): Channel[] => {
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

	const SortedExistingChannels = ExistingChannels.sort((a, b) => a.Position - b.Position);

	if (Channel.ParentId && !IgnoreParent) {
		const AllChannelsRelatingToParentId = SortedExistingChannels.filter((FilteredChannel) => {
			return FilteredChannel.ParentId === Channel.ParentId;
		});

		const Imagine = FixChannelPositions(Channel, AllChannelsRelatingToParentId, true);

		const FilteredExistingChannels = SortedExistingChannels.filter((FilteredChannel) => {
			return !Imagine.some((UpdatedChannel) => UpdatedChannel.ChannelId === FilteredChannel.ChannelId);
		});

		return [...FilteredExistingChannels, ...Imagine].sort((a, b) => a.Position - b.Position);
	}

	const NewChannelPositionIndex = SortedExistingChannels.findIndex(
		(IndexedChannel) => IndexedChannel.Position === Channel.Position,
	);

	if (NewChannelPositionIndex === -1) {
		const LastPosition = SortedExistingChannels[SortedExistingChannels.length - 1]?.Position ?? 0;

		return [
			...SortedExistingChannels,
			{
				...Channel,
				Position: LastPosition + 1,
			},
		].sort((a, b) => a.Position - b.Position);
	} else {
		const ChannelsUnderNewChannelPosition = SortedExistingChannels.filter((FilteredChannel) => {
			return (
				FilteredChannel.Position >= Channel.Position && (IgnoreParent ? true : FilteredChannel.ParentId.length === 0)
			);
		});

		const UpdatedChannels = ChannelsUnderNewChannelPosition.map((MappedChannel) => {
			return {
				...MappedChannel,
				Position: MappedChannel.Position + 1,
			};
		});

		const FilteredExistingChannels = SortedExistingChannels.filter((FilteredChannel) => {
			return !UpdatedChannels.some((UpdatedChannel) => UpdatedChannel.ChannelId === FilteredChannel.ChannelId);
		});

		return [
			...FilteredExistingChannels,
			...UpdatedChannels,
			{
				...Channel,
				Position: Channel.Position,
			},
		].sort((a, b) => a.Position - b.Position);
	}
};
