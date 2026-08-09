<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, LogOut, UserRound } from 'lucide-svelte';
	import { myProfile } from '$lib/db/store';
	import { signOut } from '$lib/db/repo';
	import { homeGreeting, homeTitleCompact } from '$lib/stores/navChrome';
	import AvatarBadge from '$lib/components/AvatarBadge.svelte';
	import BrandMark from '$lib/components/BrandMark.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import ProfileSettings from './ProfileSettings.svelte';

	let menuMounted = $state(false);
	let menuClosing = $state(false);
	let settingsOffen = $state(false);
	let closeTimer: ReturnType<typeof setTimeout> | null = null;

	const MENU_MS = 280;

	let onTrip = $derived(page.url.pathname.startsWith('/trip/'));
	let showCompactHomeTitle = $derived(!onTrip && $homeTitleCompact && Boolean($homeGreeting));

	function clearCloseTimer() {
		if (closeTimer) {
			clearTimeout(closeTimer);
			closeTimer = null;
		}
	}

	function openMenu() {
		clearCloseTimer();
		menuClosing = false;
		menuMounted = true;
	}

	function closeMenu() {
		if (!menuMounted || menuClosing) return;
		menuClosing = true;
		clearCloseTimer();
		closeTimer = setTimeout(() => {
			menuMounted = false;
			menuClosing = false;
			closeTimer = null;
		}, MENU_MS);
	}

	function toggleMenu() {
		if (menuMounted && !menuClosing) closeMenu();
		else openMenu();
	}

	function onDocClick(e: MouseEvent) {
		if (!menuMounted || menuClosing) return;
		const el = e.target as HTMLElement;
		if (!el.closest('[data-avatar-menu]')) closeMenu();
	}

	async function abmelden() {
		closeMenu();
		await signOut();
	}
</script>

<svelte:document onclick={onDocClick} />

<header class="material-chrome z-40">
	<div
		class="relative z-10 mx-auto flex h-[3.75rem] max-w-2xl items-center justify-between gap-2 px-4 pt-[env(safe-area-inset-top)] sm:px-5"
	>
		{#if onTrip}
			<a
				href="/"
				class="pressable icon-btn -ml-1.5 flex min-h-11 min-w-11 items-center gap-1 rounded-full px-2 hover:bg-white/45 hover:text-ink dark:hover:bg-night-raised dark:hover:text-cream"
				aria-label="Alle Trips"
			>
				<ArrowLeft size={20} strokeWidth={1.75} />
				<span class="text-[0.9375rem] font-semibold tracking-tight">Trips</span>
			</a>
		{:else}
			<a
				href="/"
				class="pressable flex min-h-11 items-center gap-2.5 px-0.5 transition-opacity duration-200"
				class:opacity-0={showCompactHomeTitle}
				class:pointer-events-none={showCompactHomeTitle}
				aria-hidden={showCompactHomeTitle}
				tabindex={showCompactHomeTitle ? -1 : 0}
			>
				<BrandMark size="md" />
				<span class="font-brand text-[1.2rem] tracking-tight">Roßmühle</span>
			</a>
		{/if}

		{#if showCompactHomeTitle}
			<p
				class="nav-compact-title pointer-events-none absolute inset-x-16 truncate text-center text-[1.05rem] font-semibold tracking-tight text-ink dark:text-cream"
			>
				{$homeGreeting}
			</p>
		{/if}

		<div class="relative z-10 flex items-center gap-0.5">
			<ThemeToggle />
			{#if $myProfile}
				<div class="relative" data-avatar-menu>
					<button
						onclick={toggleMenu}
						aria-label={menuMounted && !menuClosing ? 'Menü schließen' : 'Profilmenü öffnen'}
						aria-expanded={menuMounted && !menuClosing}
						aria-haspopup="menu"
						class="pressable flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/45 dark:hover:bg-night-raised"
					>
						<AvatarBadge name={$myProfile.name} src={$myProfile.avatar?.url} size="md" />
					</button>
					{#if menuMounted}
						<div
							role="menu"
							class="menu-surface card-soft absolute right-0 mt-2 w-56 overflow-hidden p-1.5 shadow-[var(--shadow-soft)]"
							class:menu-surface--out={menuClosing}
						>
							<p
								class="border-b border-line/50 px-3 py-2.5 text-sm font-semibold text-ink dark:border-night-line dark:text-cream"
							>
								{$myProfile.name}
							</p>
							<button
								role="menuitem"
								onclick={() => {
									closeMenu();
									settingsOffen = true;
								}}
								class="pressable flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm text-ink hover:bg-sunken/60 dark:text-cream dark:hover:bg-night-sunken"
							>
								<UserRound size={16} strokeWidth={1.75} />
								Profil bearbeiten
							</button>
							<button
								role="menuitem"
								onclick={abmelden}
								class="pressable flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm text-ink hover:bg-sunken/60 dark:text-cream dark:hover:bg-night-sunken"
							>
								<LogOut size={16} strokeWidth={1.75} />
								Abmelden
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</header>

<ProfileSettings open={settingsOffen} onclose={() => (settingsOffen = false)} />
