<script lang="ts">
	import { MapPin, Calendar, ChevronRight } from 'lucide-svelte';
	import type { Trip } from '$lib/types';

	interface Props {
		trip: Trip;
	}

	let { trip }: Props = $props();

	function formatDate(iso?: string): string | null {
		if (!iso) return null;
		const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
		if (isNaN(d.getTime())) return null;
		return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
	}

	let zeitraum = $derived.by(() => {
		const von = formatDate(trip.startDate);
		const bis = formatDate(trip.endDate);
		if (von && bis) return `${von} – ${bis}`;
		return von ?? bis ?? null;
	});

	let meta = $derived(
		[trip.location, zeitraum].filter(Boolean).join(' · ') || String(trip.year)
	);
</script>

<a
	href="/trip/{trip.id}"
	class="group-row min-h-[4.5rem] gap-3 px-4 py-3 text-inherit no-underline"
>
	<span class="min-w-0 flex-1">
		<span class="micro-label micro-label-caps text-ink-soft dark:text-cream-soft">{trip.year}</span>
		<span class="mt-0.5 block truncate text-[1.0625rem] font-semibold tracking-tight">
			{trip.name}
		</span>
		<span class="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[0.8125rem] text-ink-soft dark:text-cream-soft">
			{#if trip.location}
				<MapPin size={13} strokeWidth={1.75} class="shrink-0 opacity-70" />
			{:else if zeitraum}
				<Calendar size={13} strokeWidth={1.75} class="shrink-0 opacity-70" />
			{/if}
			<span class="truncate">{meta}</span>
		</span>
	</span>
	<ChevronRight
		size={18}
		strokeWidth={1.75}
		class="shrink-0 text-ink-soft/45 dark:text-cream-soft/35"
		aria-hidden="true"
	/>
</a>
