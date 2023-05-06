export interface Role {
	AllowedMentions?: number;
	AllowedNsfw?: boolean;
	Color?: number;
	Deleteable: boolean;
	Guild: string;
	Hoisted?: boolean;
	Name: string;
	Permissions: string;
	Position: number;
	_id: string;
}
