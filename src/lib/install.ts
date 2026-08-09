/** PWA / Homescreen helpers — detect platform and whether already installed. */

export type InstallPlatform = 'ios' | 'android' | 'other';

const DISMISS_KEY = 'camping-install-hint-dismissed';

type NavigatorUAData = {
	mobile?: boolean;
	platform?: string;
};

function uaData(): NavigatorUAData | undefined {
	return (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData;
}

/**
 * Nur echte Handys/Tablets — Desktop (Linux/Windows/Mac) bleibt „other“,
 * auch wenn der User-Agent mal seltsam ist.
 */
export function getInstallPlatform(): InstallPlatform {
	if (typeof navigator === 'undefined') return 'other';

	// Chromium Client Hints: auf Desktop explizit mobile === false
	const hints = uaData();
	if (hints && hints.mobile === false) return 'other';

	const ua = navigator.userAgent || '';

	const iOS =
		/iPad|iPhone|iPod/.test(ua) ||
		(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
	if (iOS) return 'ios';

	if (/Android/i.test(ua)) return 'android';

	return 'other';
}

/** True when running as installed PWA (standalone / iOS home screen). */
export function isRunningAsInstalledApp(): boolean {
	if (typeof window === 'undefined') return false;
	const standalone = window.matchMedia('(display-mode: standalone)').matches;
	const iosStandalone =
		'standalone' in navigator &&
		Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
	return standalone || iosStandalone;
}

/** Soll der Homescreen-Hinweis gezeigt werden? */
export function shouldShowInstallHint(): boolean {
	if (typeof window === 'undefined') return false;
	if (isRunningAsInstalledApp()) return false;
	if (wasInstallHintDismissed()) return false;

	const platform = getInstallPlatform();
	if (platform === 'other') return false;

	// Typischer Desktop: Maus + Hover → kein Hinweis (Android-Emulation in DevTools ausgenommen via UA)
	const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	if (desktopPointer && platform === 'android') return false;

	return true;
}

export function wasInstallHintDismissed(): boolean {
	if (typeof localStorage === 'undefined') return true;
	try {
		return localStorage.getItem(DISMISS_KEY) === '1';
	} catch {
		return true;
	}
}

export function dismissInstallHint() {
	try {
		localStorage.setItem(DISMISS_KEY, '1');
	} catch {
		/* ignore */
	}
}
