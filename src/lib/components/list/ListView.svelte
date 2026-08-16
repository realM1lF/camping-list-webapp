<script module lang="ts">
	import { getItemStatus } from '$lib/status';
	import type { Item, ItemFilter } from '$lib/types';

	const STATUS_ORDER = { open: 0, partial: 1, covered: 2 } as const;

	/** Offene zuerst, dann teilweise, dann versorgt; innerhalb alphabetisch (de). */
	export function sortItems(items: Item[]): Item[] {
		return [...items].sort((a, b) => {
			const byStatus = STATUS_ORDER[getItemStatus(a)] - STATUS_ORDER[getItemStatus(b)];
			if (byStatus !== 0) return byStatus;
			return a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });
		});
	}

	/** „Noch offen“ = offen + teilweise; „Meine Zusagen“ = ich habe zugesagt. */
	export function filterItems(items: Item[], filter: ItemFilter, myProfileId?: string): Item[] {
		switch (filter) {
			case 'open':
				return items.filter((i) => getItemStatus(i) !== 'covered');
			case 'mine':
				return items.filter((i) => (i.claims ?? []).some((c) => c.user?.id === myProfileId));
			default:
				return items;
		}
	}
</script>

<script lang="ts">
	import ItemRow from './ItemRow.svelte';

	interface Props {
		items: Item[];
		filter: ItemFilter;
		myProfileId?: string;
		compact?: boolean;
		onselect: (item: Item) => void;
	}

	let { items, filter, myProfileId, compact = true, onselect }: Props = $props();

	let visible = $derived(sortItems(filterItems(items, filter, myProfileId)));
</script>

{#if visible.length === 0}
	<div class="group-list px-5 py-14 text-center">
		<p class="font-display text-lg font-semibold">Nichts Passendes</p>
		<p class="mt-1.5 text-sm text-ink-soft dark:text-cream-soft">
			Filter ändern oder etwas Neues anlegen.
		</p>
	</div>
{:else}
	<ul class="group-list">
		{#each visible as item (item.id)}
			<li>
				<ItemRow {item} {compact} {onselect} />
			</li>
		{/each}
	</ul>
{/if}
