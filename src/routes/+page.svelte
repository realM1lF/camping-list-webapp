<script lang="ts">
	import { browser } from '$app/environment';
	import { Plus } from 'lucide-svelte';
	import BrandMark from '$lib/components/BrandMark.svelte';
	import { myProfile, query } from '$lib/db/store';
	import { homeGreeting, homeTitleCompact } from '$lib/stores/navChrome';
	import type { Trip } from '$lib/types';
	import TripCard from '$lib/components/shell/TripCard.svelte';
	import NewTripSheet from '$lib/components/shell/NewTripSheet.svelte';

	let sheetOffen = $state(false);

	const tripsQuery = query<{ trips: Trip[] }>({ trips: { createdBy: {} } });

	let trips = $derived(
		[...($tripsQuery.data?.trips ?? [])].sort(
			(a, b) => b.year - a.year || (a.startDate ?? '').localeCompare(b.startDate ?? '')
		)
	);

	let datumHeute = $derived(
		new Date().toLocaleDateString('de-DE', {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		})
	);

	let vorname = $derived($myProfile?.name.trim().split(/\s+/)[0] ?? '');

	$effect(() => {
		homeGreeting.set(vorname ? `Moin, ${vorname}` : 'Moin');
		return () => {
			homeGreeting.set('');
			homeTitleCompact.set(false);
		};
	});

	$effect(() => {
		if (!browser) return;
		const onScroll = () => {
			homeTitleCompact.set(window.scrollY > 52);
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<div class="flex flex-col gap-7 pt-5 pb-28">
	<header class="large-title" class:large-title--compact={$homeTitleCompact}>
		<p class="large-title-eyebrow micro-label mb-2 text-ink-soft dark:text-cream-soft">
			{datumHeute}
		</p>
		<h1 class="large-title-heading font-display font-semibold tracking-tight">
			Moin{#if vorname}, <span class="font-semibold">{vorname}</span>{/if}
		</h1>
		<p class="large-title-sub mt-2 text-[0.9375rem] text-ink-soft dark:text-cream-soft">
			Bereit für den nächsten Trip?
		</p>
	</header>

	{#if $tripsQuery.isLoading}
		<p class="micro-label text-ink-soft dark:text-cream-soft">Lade Trips …</p>
	{:else if trips.length === 0}
		<div class="group-list flex flex-col items-center gap-4 px-6 py-14 text-center">
			<BrandMark size="lg" />
			<div>
				<p class="font-display text-xl font-semibold">Noch kein Trip</p>
				<p class="mx-auto mt-1.5 max-w-[16rem] text-sm leading-relaxed text-ink-soft dark:text-cream-soft">
					Zeit, den nächsten Trip zu planen.
				</p>
			</div>
			<button type="button" class="btn-primary gap-2 px-5" onclick={() => (sheetOffen = true)}>
				<Plus size={18} strokeWidth={1.75} />
				Ersten Trip anlegen
			</button>
		</div>
	{:else}
		<section>
			<div class="mb-2.5 flex items-baseline justify-between gap-3 px-1">
				<h2 class="font-display text-lg font-semibold tracking-tight">Deine Trips</h2>
				<span class="micro-label micro-label-caps text-ink-soft dark:text-cream-soft">
					{trips.length}
				</span>
			</div>
			<ul class="group-list">
				{#each trips as trip (trip.id)}
					<li>
						<TripCard {trip} />
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

{#if trips.length > 0}
	<button
		onclick={() => (sheetOffen = true)}
		aria-label="Neuen Trip anlegen"
		class="btn-primary fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 h-14 w-14 !min-h-14 !px-0"
	>
		<Plus size={26} strokeWidth={1.75} class="shrink-0" />
	</button>
{/if}

<NewTripSheet open={sheetOffen} onclose={() => (sheetOffen = false)} />
