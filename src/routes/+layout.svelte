<script lang="ts">
	import { browser } from '$app/environment';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { auth, myProfile } from '$lib/db/store';
	import BrandMark from '$lib/components/BrandMark.svelte';
	import LoginScreen from '$lib/components/shell/LoginScreen.svelte';
	import ProfileSetup from '$lib/components/shell/ProfileSetup.svelte';
	import AppHeader from '$lib/components/shell/AppHeader.svelte';
	import InstallHintSheet from '$lib/components/shell/InstallHintSheet.svelte';

	let { children } = $props();

	// Dev: alter PWA-Service-Worker (z. B. von vite preview) liefert sonst gecachte Alt-CSS → Flackern
	$effect(() => {
		if (!browser || !import.meta.env.DEV || !('serviceWorker' in navigator)) return;
		navigator.serviceWorker.getRegistrations().then((regs) => {
			for (const reg of regs) void reg.unregister();
		});
		caches.keys().then((keys) => {
			for (const key of keys) void caches.delete(key);
		});
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if $auth.isLoading || ($auth.user && $myProfile === undefined)}
	<main class="flex min-h-dvh items-center justify-center" aria-live="polite" aria-busy="true">
		<span class="zelt-lade" role="img" aria-label="Lädt …">
			<BrandMark size="lg" />
		</span>
	</main>
{:else if !$auth.user}
	<LoginScreen />
{:else if $myProfile === null}
	<ProfileSetup />
{:else}
	<AppHeader />
	<div class="mx-auto max-w-2xl px-4 pb-[env(safe-area-inset-bottom)] sm:px-5">
		{@render children()}
	</div>
	{#if $myProfile}
		<InstallHintSheet name={$myProfile.name} />
	{/if}
{/if}

<style>
	.zelt-lade {
		animation: zelt-in 420ms cubic-bezier(0.32, 0.72, 0, 1) both;
	}
	@keyframes zelt-in {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
		to {
			opacity: 0.92;
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.zelt-lade {
			animation: none;
			opacity: 0.9;
		}
	}
</style>
