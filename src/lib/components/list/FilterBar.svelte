<script lang="ts">
	import { haptic } from '$lib/motion/haptic';
	import type { ItemFilter } from '$lib/types';

	interface Props {
		filter: ItemFilter;
		onchange: (filter: ItemFilter) => void;
	}

	let { filter, onchange }: Props = $props();

	function select(id: ItemFilter) {
		if (id === filter) return;
		haptic('light');
		onchange(id);
	}

	const SEGMENTS: Array<{ id: ItemFilter; label: string; short: string }> = [
		{ id: 'all', label: 'Alle', short: 'Alle' },
		{ id: 'open', label: 'Noch offen', short: 'Offen' },
		{ id: 'mine', label: 'Meine Zusagen', short: 'Meine' }
	];
</script>

<div class="segmented w-full" role="group" aria-label="Liste filtern">
	{#each SEGMENTS as seg (seg.id)}
		<button
			type="button"
			onclick={() => select(seg.id)}
			aria-pressed={filter === seg.id}
			aria-label={seg.label}
			title={seg.label}
			class="pressable segmented-item min-h-11 min-w-0 flex-1 px-2 text-[0.8125rem] font-semibold sm:px-3"
		>
			<span class="truncate sm:hidden">{seg.short}</span>
			<span class="hidden truncate sm:inline">{seg.label}</span>
		</button>
	{/each}
</div>
