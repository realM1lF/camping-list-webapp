export const CATEGORIES = [
	{ id: 'kueche', label: 'Küche', emoji: '🍲' },
	{ id: 'wohnen', label: 'Wohnen', emoji: '⛺' },
	{ id: 'spiel', label: 'Spiel & Spaß', emoji: '🎲' },
	{ id: 'sonstiges', label: 'Sonstiges', emoji: '🎒' }
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export function categoryLabel(id: string): string {
	return CATEGORIES.find((c) => c.id === id)?.label ?? 'Sonstiges';
}

/** Normalisiert alte/unbekannte Kategorie-IDs auf die vier aktuellen. */
export function normalizeCategory(id: string): CategoryId {
	return (CATEGORIES.some((c) => c.id === id) ? id : 'sonstiges') as CategoryId;
}

/**
 * Auswahl für den Emoji-Picker – Camping-lastig, aber breit.
 * Nutzer können zusätzlich jedes beliebige Emoji über die System-Tastatur setzen.
 */
export const EMOJI_CHOICES = [
	// Shelter & Schlafen
	'⛺', '🏕️', '🛌', '🛏️', '😴', '🧖', '🪑', '🪵', '🧺', '🕯️',
	// Küche & Feuer
	'🔥', '🍳', '🥘', '🍲', '☕', '🫖', '🍽️', '🥄', '🔪', '🧊', '🧂', '🍯',
	// Verpflegung
	'🍺', '🍻', '🍷', '🥃', '🥤', '💧', '🍞', '🥨', '🧀', '🥩', '🍖', '🌭', '🥫', '🍝', '🥗', '🍫', '🍡', '🍎',
	// Hygiene
	'🧼', '🪥', '🧴', '🧻', '🚿', '🏖️', '🩹', '💊', '🦟', '🗑️',
	// Werkzeug & Technik
	'🔦', '💡', '🔋', '🔌', '📱', '🔊', '📻', '🪓', '🔨', '🛠️', '🪢', '🧰', '🔑', '🧭',
	// Kleidung & Wetter
	'🥾', '🧥', '🧢', '🕶️', '☔', '🌧️', '☀️', '🌡️', '🧤', '🩴',
	// Freizeit
	'🎲', '♟️', '🃏', '🎸', '🎤', '⚽', '🏐', '🥏', '🏸', '🎣', '🏊', '🚣', '📖', '📷', '🎨', '🪁',
	// Natur & Tiere
	'🌲', '🌳', '🍄', '🌊', '🐟', '🦆', '🦌', '🐿️', '🌅', '⭐',
	// Transport & Misc
	'🚗', '🚐', '🛻', '🚲', '🎒', '🧳', '📋', '✏️', '💰', '🎁', '❤️', '✅'
] as const;
