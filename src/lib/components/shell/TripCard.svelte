<script lang="ts">
	import { MapPin, Calendar, ChevronRight, Pencil, Trash2 } from 'lucide-svelte';
	import { getTripProgress } from '$lib/status';
	import type { Trip } from '$lib/types';

	interface Props {
		trip: Trip;
		canManage?: boolean;
		onedit?: () => void;
		ondelete?: () => void;
	}

	let { trip, canManage = false, onedit, ondelete }: Props = $props();

	let confirmDelete = $state(false);

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

	let progress = $derived(getTripProgress(trip.items));
	let statusLabel = $derived(
		progress.total === 0
			? 'Noch leer'
			: progress.complete
				? 'Versorgt'
				: 'Noch offen'
	);
</script>

<div class="group-row min-h-[4.5rem] items-stretch gap-0 p-0">
	<a
		href="/trip/{trip.id}"
		class="flex min-h-[4.5rem] min-w-0 flex-1 items-center gap-3 px-4 py-3 text-inherit no-underline"
		aria-label="{trip.name}, {statusLabel}{progress.total > 0
			? `, ${progress.covered} von ${progress.total}`
			: ''}"
	>
		<span class="min-w-0 flex-1">
			<span class="micro-label micro-label-caps text-ink-soft dark:text-cream-soft">{trip.year}</span>
			<span class="mt-0.5 block truncate text-[1.0625rem] font-semibold tracking-tight">
				{trip.name}
			</span>
			<span
				class="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[0.8125rem] text-ink-soft dark:text-cream-soft"
			>
				{#if trip.location}
					<MapPin size={13} strokeWidth={1.75} class="shrink-0 opacity-70" />
				{:else if zeitraum}
					<Calendar size={13} strokeWidth={1.75} class="shrink-0 opacity-70" />
				{/if}
				<span class="truncate">{meta}</span>
			</span>

			{#if progress.total > 0}
				<span
					class="mt-2.5 flex items-center gap-2.5"
					role="progressbar"
					aria-valuenow={progress.pct}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label="Versorgungsgrad: {progress.covered} von {progress.total}"
				>
					<span
						class="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-sunken/80 dark:bg-night-sunken"
					>
						<span
							class="block h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] {progress.complete
								? 'bg-moss'
								: 'bg-ember'}"
							style="width: {progress.pct}%"
						></span>
					</span>
					<span
						class="shrink-0 text-[0.75rem] font-semibold tabular-nums {progress.complete
							? 'text-moss'
							: 'text-ink-soft dark:text-cream-soft'}"
					>
						{progress.covered}/{progress.total}
						<span class={progress.complete ? '' : 'text-ember-deep dark:text-ember'}>
							· {statusLabel}
						</span>
					</span>
				</span>
			{:else}
				<span class="mt-2 block text-[0.75rem] text-ink-soft dark:text-cream-soft">Noch leer</span>
			{/if}
		</span>
		<ChevronRight
			size={18}
			strokeWidth={1.75}
			class="shrink-0 self-center text-ink-soft/45 dark:text-cream-soft/35"
			aria-hidden="true"
		/>
	</a>

	{#if canManage}
		<div class="flex shrink-0 flex-col justify-center gap-0.5 pr-2">
			{#if confirmDelete}
				<button
					type="button"
					class="pressable min-h-11 px-2 text-[0.75rem] font-semibold text-red-600 dark:text-red-400"
					onclick={() => {
						confirmDelete = false;
						ondelete?.();
					}}
				>
					Löschen
				</button>
				<button
					type="button"
					class="pressable min-h-11 px-2 text-[0.75rem] font-medium text-ink-soft dark:text-cream-soft"
					onclick={() => (confirmDelete = false)}
				>
					Abbrechen
				</button>
			{:else}
				<button
					type="button"
					class="pressable grid h-11 w-11 place-items-center rounded-full text-ink-soft hover:bg-sunken/60 hover:text-ink dark:text-cream-soft dark:hover:bg-night-sunken dark:hover:text-cream"
					onclick={() => onedit?.()}
					aria-label="Trip bearbeiten"
				>
					<Pencil size={16} strokeWidth={1.75} />
				</button>
				<button
					type="button"
					class="pressable grid h-11 w-11 place-items-center rounded-full text-ink-soft hover:bg-sunken/60 hover:text-red-600 dark:text-cream-soft dark:hover:bg-night-sunken dark:hover:text-red-400"
					onclick={() => (confirmDelete = true)}
					aria-label="Trip löschen"
				>
					<Trash2 size={16} strokeWidth={1.75} />
				</button>
			{/if}
		</div>
	{/if}
</div>
