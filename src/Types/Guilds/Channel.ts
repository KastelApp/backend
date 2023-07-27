export interface Channel {
	AllowedMentions?: number;
	Children?: string[];
	Description?: string;
	Guild: string;
	Name: string;
	Nsfw?: boolean;
	Parent?: string;
	Permissions: number;
	Position: number;
	Type: number;
	_id: string;
}
