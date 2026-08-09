<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { Rows3, AlignJustify, Plus } from 'lucide-svelte';
	import BrandMark from '$lib/components/BrandMark.svelte';
	import ItemDetailSheet from '$lib/components/detail/ItemDetailSheet.svelte';
	import CategoryView from '$lib/components/list/CategoryView.svelte';
	import FilterBar from '$lib/components/list/FilterBar.svelte';
	import NewItemSheet from '$lib/components/list/NewItemSheet.svelte';
	import { myProfile, query } from '$lib/db/store';
	import { haptic } from '$lib/motion/haptic';
	import { getItemStatus } from '$lib/status';
	import type { Item, ItemFilter, ListView as ListViewMode, Trip } from '$lib/types';

	interface TripWithItems extends Trip {
		items?: Item[];
	}

	const tripId = page.params.id ?? '';

	const tripQuery = query<{ trips: TripWithItems[] }>({
		trips: {
			$: { where: { id: tripId } },
			items: {
				claims: { user: { avatar: {} } },
				comments: { author: { avatar: {} } },
				createdBy: { avatar: {} }
			}
		}
	} as never);

	let trip = $derived($tripQuery.data?.trips?.[0]);
	let items = $derived(trip?.items ?? []);
	let myProfileId = $derived($myProfile?.id ?? '');

	let view = $state<ListViewMode>('category');
	let filter = $state<ItemFilter>('all');
	let selectedItemId = $state<string | null>(null);
	let detailOpen = $state(false);
	let newItemOpen = $state(false);

	let selectedItem = $derived(items.find((i) => i.id === selectedItemId) ?? null);

	$effect(() => {
		if (!browser) return;
		const saved = localStorage.getItem('packlist-view');
		if (saved === 'compact' || saved === 'list') view = 'compact';
		else if (saved === 'category') view = 'category';
	});
	$effect(() => {
		if (browser) localStorage.setItem('packlist-view', view);
	});

	let coveredCount = $derived(items.filter((i) => getItemStatus(i) === 'covered').length);
	let totalCount = $derived(items.length);
	let progressPct = $derived(totalCount === 0 ? 0 : Math.round((coveredCount / totalCount) * 100));

	function openDetail(item: Item) {
		selectedItemId = item.id;
		detailOpen = true;
	}

	function setView(next: ListViewMode) {
		if (next === view) return;
		haptic('light');
		view = next;
	}
</script>

<svelte:head>
	<title>{trip ? `${trip.name} – Packliste` : 'Packliste'}</title>
</svelte:head>

<div class="mx-auto w-full max-w-2xl pt-3 pb-28">
	<header class="mb-3">
		<div class="flex items-start gap-3">
			<div class="min-w-0 flex-1">
				{#if trip}
					<h1
						class="text-[1.5rem] leading-snug font-semibold tracking-tight text-balance break-words hyphens-auto"
					>
						{trip.name}
					</h1>
					{#if trip.location}
						<p class="mt-0.5 truncate text-sm text-ink-soft dark:text-cream-soft">{trip.location}</p>
					{/if}
				{:else if $tripQuery.isLoading}
					<h1 class="font-display text-[1.65rem] font-semibold tracking-tight">Packliste</h1>
				{:else}
					<h1 class="font-display text-[1.65rem] font-semibold tracking-tight">Nicht gefunden</h1>
				{/if}
			</div>

			<div class="segmented mt-0.5 shrink-0" role="group" aria-label="Ansicht wechseln">
				<button
					type="button"
					onclick={() => setView('category')}
					aria-pressed={view === 'category'}
					title="Kategorien"
					aria-label="Kategorieansicht"
					class="pressable segmented-item !min-h-11 !min-w-11 !px-0"
				>
					<AlignJustify size={17} strokeWidth={1.75} />
				</button>
				<button
					type="button"
					onclick={() => setView('compact')}
					aria-pressed={view === 'compact'}
					title="Kompakt"
					aria-label="Kompakte Ansicht"
					class="pressable segmented-item !min-h-11 !min-w-11 !px-0"
				>
					<Rows3 size={17} strokeWidth={1.75} />
				</button>
			</div>
		</div>

		{#if trip && totalCount > 0}
			<div
				class="mt-2.5 flex items-center gap-2.5"
				role="progressbar"
				aria-valuenow={progressPct}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label="Versorgungsgrad: {coveredCount} von {totalCount}"
			>
				<div
					class="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-sunken/80 dark:bg-night-sunken"
				>
					<div
						class="h-full rounded-full bg-ember transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
						style="width: {progressPct}%"
					></div>
				</div>
				<span class="shrink-0 text-xs font-semibold tabular-nums text-ink-soft dark:text-cream-soft">
					{coveredCount}/{totalCount}
					<span class="text-ember-deep dark:text-ember"> · {progressPct}%</span>
				</span>
			</div>
		{/if}
	</header>

	{#if trip}
		<div class="mb-3">
			<FilterBar {filter} onchange={(f) => (filter = f)} />
		</div>

		{#if totalCount === 0}
			<div class="group-list flex flex-col items-center gap-4 px-6 py-14 text-center">
				<BrandMark size="lg" />
				<div>
					<p class="font-display text-xl font-semibold">Noch nichts auf der Liste</p>
					<p
						class="mx-auto mt-1.5 max-w-[16rem] text-sm leading-relaxed text-ink-soft dark:text-cream-soft"
					>
						Leg den ersten Bedarf an – die anderen sagen zu.
					</p>
				</div>
				<button
					type="button"
					class="btn-primary gap-2 px-5"
					onclick={() => (newItemOpen = true)}
					disabled={!myProfileId}
				>
					<Plus size={18} strokeWidth={1.75} />
					Ersten Eintrag
				</button>
			</div>
		{:else}
			<CategoryView
				{items}
				{filter}
				{myProfileId}
				density={view === 'compact' ? 'compact' : 'comfortable'}
				onselect={openDetail}
			/>
		{/if}
	{:else if !$tripQuery.isLoading}
		<p class="py-16 text-center text-sm text-ink-soft dark:text-cream-soft">
			Diesen Trip gibt es nicht (mehr).
			<a href="/" class="font-medium text-ember underline">Zur Übersicht</a>
		</p>
	{/if}
</div>

{#if trip && myProfileId && totalCount > 0}
	<button
		type="button"
		onclick={() => (newItemOpen = true)}
		aria-label="Neues Item anlegen"
		class="btn-primary fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 h-14 w-14 !min-h-14 !px-0"
	>
		<Plus size={26} strokeWidth={1.75} class="shrink-0" />
	</button>
{/if}

{#if trip && myProfileId}
	<NewItemSheet open={newItemOpen} {tripId} {myProfileId} onclose={() => (newItemOpen = false)} />
{/if}

{#if selectedItem}
	<ItemDetailSheet
		item={selectedItem}
		{myProfileId}
		open={detailOpen}
		onclose={() => (detailOpen = false)}
	/>
{/if}
