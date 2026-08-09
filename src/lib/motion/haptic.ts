/**
 * Multimodal feedback — utility only, on causal commit moments (Apple §13).
 * No-op when Vibration API missing or user prefers reduced motion.
 */

export type HapticKind = 'light' | 'medium' | 'success' | 'warning';

const PATTERNS: Record<HapticKind, number | number[]> = {
	light: 8,
	medium: 16,
	success: [10, 40, 14],
	warning: [18, 50, 18]
};

export function haptic(kind: HapticKind = 'light') {
	if (typeof window === 'undefined') return;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
	try {
		navigator.vibrate(PATTERNS[kind]);
	} catch {
		/* ignore */
	}
}
