export interface AvatarFile {
	id: string;
	url?: string;
	path?: string;
}

export interface Profile {
	id: string;
	name: string;
	emoji?: string;
	createdAt: number;
	avatar?: AvatarFile | null;
}

export interface Trip {
	id: string;
	name: string;
	year: number;
	location?: string;
	startDate?: string;
	endDate?: string;
	createdAt: number;
	createdBy?: Profile;
}

export interface Claim {
	id: string;
	count: number;
	createdAt: number;
	user?: Profile;
}

export interface Comment {
	id: string;
	text: string;
	createdAt: number;
	author?: Profile;
}

export interface Item {
	id: string;
	name: string;
	emoji: string;
	category: string;
	neededCount: number;
	createdAt: number;
	createdBy?: Profile;
	claims?: Claim[];
	comments?: Comment[];
}

export type ItemStatus = 'open' | 'partial' | 'covered';

/** category = normale Kategoriegruppen; compact = gleiche Gruppen, dichtere Zeilen */
export type ListView = 'category' | 'compact';
export type ItemFilter = 'all' | 'open' | 'mine';
