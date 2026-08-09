<script lang="ts">
	import { CATEGORIES, normalizeCategory } from '$lib/data/keywords';
	import ItemRow from './ItemRow.svelte';
	import { filterItems, sortItems } from './ListView.svelte';
	import type { Item, ItemFilter } from '$lib/types';

	interface Props {
		items: Item[];
		filter: ItemFilter;
		myProfileId?: string;
		density?: 'comfortable' | 'compact';
		onselect: (item: Item) => void;
	}

	let { items, filter, myProfileId, density = 'comfortable', onselect }: Props = $props();

	let compact = $derived(density === 'compact');

	let groups = $derived(
		CATEGORIES.map((cat) => ({
			...cat,
			items: sortItems(filterItems(items, filter, myProfileId)).filter(
				(i) => normalizeCategory(i.category) === cat.id
			)
		})).filter((g) => g.items.length > 0)
	);
</script>

{#if groups.length === 0}
	<div class="group-list px-5 py-14 text-center">
		<p class="font-display text-lg font-semibold">Nichts Passendes</p>
		<p class="mt-1.5 text-sm text-ink-soft dark:text-cream-soft">
			Filter ändern oder etwas Neues anlegen.
		</p>
	</div>
{:else}
	<div class={compact ? 'space-y-5' : 'space-y-7'}>
		{#each groups as group (group.id)}
			<section aria-label={group.label}>
				<header class="mb-2 flex items-end justify-between gap-3 px-1">
					<h2 class="flex items-center gap-2">
						<span class="text-[1.05rem] leading-none opacity-90" aria-hidden="true"
							>{group.emoji}</span
						>
						<span class="text-[0.9375rem] font-semibold tracking-tight">
							{group.label}
						</span>
					</h2>
					<span class="micro-label micro-label-caps pb-0.5 text-ink-soft dark:text-cream-soft">
						{group.items.length}
					</span>
				</header>
				<ul class="group-list">
					{#each group.items as item (item.id)}
						<li>
							<ItemRow {item} {compact} {onselect} />
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}
