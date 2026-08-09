<script lang="ts">
	import { EMOJI_CHOICES } from '$lib/data/keywords';

	interface Props {
		value: string;
		onchange: (emoji: string) => void;
	}

	let { value, onchange }: Props = $props();

	let freeInput = $state('');

	function onFreeInput(e: Event) {
		const raw = (e.currentTarget as HTMLInputElement).value;
		// Erstes Emoji/Graphem übernehmen – deckt auch mehrteilige Emoji (ZWJ) ab.
		const segmenter = new Intl.Segmenter('de', { granularity: 'grapheme' });
		const first = [...segmenter.segment(raw)][0]?.segment;
		if (first) {
			onchange(first);
			freeInput = '';
		}
	}
</script>

<div>
	<div
		class="grid max-h-44 grid-cols-7 gap-1 overflow-y-auto p-1 sm:grid-cols-9"
		aria-label="Emoji auswählen"
	>
		{#each EMOJI_CHOICES as choice (choice)}
			<button
				type="button"
				onclick={() => onchange(choice)}
				aria-label={`Emoji ${choice}`}
				aria-pressed={value === choice}
				class="pressable flex h-10 w-10 items-center justify-center rounded-xl text-xl {value ===
				choice
					? 'bg-ink/90 text-raised shadow-sm dark:bg-cream dark:text-night'
					: 'hover:bg-sunken/80 dark:hover:bg-night-sunken'}"
			>
				{choice}
			</button>
		{/each}
	</div>
	<label
		class="micro-label mt-2 flex min-w-0 flex-col gap-1.5 text-ink-soft sm:flex-row sm:items-center dark:text-cream-soft"
	>
		<span class="shrink-0">Anderes Emoji:</span>
		<input
			type="text"
			bind:value={freeInput}
			oninput={onFreeInput}
			placeholder="Tastatur-Emoji tippen …"
			class="input-soft !min-h-9 flex-1 !rounded-xl px-3 font-normal"
		/>
	</label>
</div>
