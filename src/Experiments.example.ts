export const experiments = [
	{
		id: '2023-05_channel-treatments',
		type: 'guild',
		treatments: [
			{
				treatment: 'control',
				description: 'This is control (does not have access to new channel)',
				config: {
					minMembers: 0, // if set to 0, no min
					maxMembers: 0, // if set to 0, no max
					requiredFlag: null, // if set to null, no flag
					overrides: [],
					releasePercentage: 1, // This is the % of guilds that will be in this treatment
					priority: 0, // The priority of this treatment is so if the guild has multiple treatments, the one with the highest priority will be used
				},
			},
			{
				treatment: 'treatment 1',
				description: 'Guild Staff may create and manage the new channel',
				config: {
					minMembers: 0,
					maxMembers: 0,
					requiredFlag: null,
					overrides: [],
					releasePercentage: 0.001, // 1% of guilds will be in this treatment
					priority: 1,
				},
			},
			{
				treatment: 'treatment 2',
				description: 'Guild Staff will get the in app prompt saying the channel is coming soon',
				config: {
					minMembers: 0,
					maxMembers: 0,
					requiredFlag: null,
					overrides: [],
					releasePercentage: 0.01, // 25% of guilds will be in this treatment
					priority: 0.5,
				},
			},
		],
	},
	{
		id: '2023-05_role-treatment',
		type: 'guild',
		treatments: [
			{
				treatment: 'control',
				description: 'This is control',
				config: {
					minMembers: 0, // if set to 0, no min
					maxMembers: 0, // if set to 0, no max
					requiredFlag: null, // if set to null, no flag
					overrides: [],
					releasePercentage: 1, // This is the % of guilds that will be in this treatment
					priority: 0, // The priority of this treatment is so if the guild has multiple treatments, the one with the highest priority will be used
				},
			},
			{
				treatment: 'treatment 1',
				description: 'Guild staff can create and manage the new role',
				config: {
					minMembers: 0,
					maxMembers: 0,
					requiredFlag: null,
					overrides: [],
					releasePercentage: 0.01, // The % of chance the guild will be in this treatment
					priority: 1,
				},
			},
		],
	},
];
