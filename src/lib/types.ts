export interface AvatarFile {
	id: string;
	url?: string;
	path?: string;
}

export interface NotifPrefs {
	notifyReplies?: boolean | null;
	notifyMentions?: boolean | null;
	notifyItemActivity?: boolean | null;
}

export interface Profile extends NotifPrefs {
	id: string;
	name: string;
	emoji?: string;
	createdAt: number;
	avatar?: AvatarFile | null;
	pushSubscription?: string | null;
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
	items?: Item[];
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
	replyTo?: Comment | null;
	mentions?: Profile[];
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

export type NotificationKind = 'reply' | 'mention' | 'item_activity';

export interface AppNotification {
	id: string;
	kind: NotificationKind;
	title: string;
	body: string;
	read: boolean;
	createdAt: number;
	tripId?: string;
	itemId?: string;
	recipient?: Profile;
}

export type ItemStatus = 'open' | 'partial' | 'covered';

/** category = normale Kategoriegruppen; compact = gleiche Gruppen, dichtere Zeilen */
export type ListView = 'category' | 'compact';
export type ItemFilter = 'all' | 'open' | 'mine';

/** Prefs: fehlend = an (Default). */
export function prefOn(value: boolean | null | undefined): boolean {
	return value !== false;
}
