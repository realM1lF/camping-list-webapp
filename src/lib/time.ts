const BERLIN = 'Europe/Berlin';

/** Aktuelle Stunde in Europe/Berlin (0–23). */
export function berlinHour(date = new Date()): number {
	const raw = new Intl.DateTimeFormat('en-GB', {
		timeZone: BERLIN,
		hour: 'numeric',
		hourCycle: 'h23'
	}).format(date);
	return Number.parseInt(raw, 10);
}

/** Datum wie „Montag, 10. August“ in Europe/Berlin. */
export function formatBerlinDate(date = new Date()): string {
	return date.toLocaleDateString('de-DE', {
		timeZone: BERLIN,
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	});
}

/**
 * Tageszeit-Begrüßung (Berlin):
 * 05–11 Moin · 11–17 Hallo · ab 17 Guten Abend
 */
export function berlinGreeting(date = new Date()): string {
	const hour = berlinHour(date);
	if (hour >= 5 && hour < 11) return 'Moin';
	if (hour >= 11 && hour < 17) return 'Hallo';
	return 'Guten Abend';
}
