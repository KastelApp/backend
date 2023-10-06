import type { PrivateFlags } from './Constants';

// Experiment Naming System: YYYY-MM-DD-<name_here> so for example "2023-08-12-voice_channel_release"

interface Treatment {
	Config: {
		MaxMembers: number;
		MinMembers: number;
		Overrides: {
			Ids: string[];
			Type: 'Guild' | 'User';
		}[];
		Priority: number;
		ReleasePercentage: number;
		RequiredFeatures: string[];
		RequiredFlags: (keyof typeof PrivateFlags)[] | null;
	};
	Description: string;
	Treatment: string;
}

interface Experiment {
	Id: string;
	Treatments: Treatment[];
	Type: 'Guild' | 'User';
}

export const Experiments: Experiment[] = [
	{
		Id: '2023-08-12-voice_channel_release',
		Type: 'Guild',
		Treatments: [
			{
				Treatment: 'control',
				Description: 'This is control (does not have access to new channel)',
				Config: {
					MinMembers: 0, // if set to 0, no min
					MaxMembers: 0, // if set to 0, no max
					RequiredFlags: null, // if set to null, no flag
					RequiredFeatures: [], // if set to [], no feature required
					Overrides: [],
					ReleasePercentage: 1, // This is the % of guilds that will be in this treatment
					Priority: 0, // The priority of this treatment is so if the guild has multiple treatments, the one with the highest priority will be used
				},
			},
			{
				Treatment: 'treatment 1',
				Description: 'Guild Staff may create and manage the new channel',
				Config: {
					MinMembers: 0,
					MaxMembers: 0,
					RequiredFlags: null,
					RequiredFeatures: [],
					Overrides: [
						{
							Type: 'Guild', // Types are 'Guild' or 'User'
							Ids: ['123456789012345678'], // The IDs of the guilds or users that will override the treatment (meaning to be in this treatment without meeting the requirements)
						},
					],
					ReleasePercentage: 0.01, // 1% of guilds will be in this treatment
					Priority: 1,
				},
			},
			{
				Treatment: 'treatment 2',
				Description: 'Guild Staff will get the in app prompt saying the channel is coming soon',
				Config: {
					MinMembers: 0,
					MaxMembers: 0,
					RequiredFlags: null,
					RequiredFeatures: [],
					Overrides: [],
					ReleasePercentage: 0.25, // 25% of guilds will be in this treatment
					Priority: 0.5,
				},
			},
		],
	},
	{
		Id: '2023-05_role-treatment',
		Type: 'Guild',
		Treatments: [
			{
				Treatment: 'control',
				Description: 'This is control',
				Config: {
					MinMembers: 0,
					MaxMembers: 0,
					RequiredFlags: null,
					RequiredFeatures: [],
					Overrides: [],
					ReleasePercentage: 1,
					Priority: 0,
				},
			},
			{
				Treatment: 'treatment 1',
				Description: 'Guild staff can create and manage the new role',
				Config: {
					MinMembers: 0,
					MaxMembers: 0,
					RequiredFlags: null,
					RequiredFeatures: [],
					Overrides: [],
					ReleasePercentage: 0.01,
					Priority: 1,
				},
			},
		],
	},
];

export type { Experiment, Treatment };
