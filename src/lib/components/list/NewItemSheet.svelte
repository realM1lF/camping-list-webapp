<script lang="ts">
	import { Minus, Plus } from 'lucide-svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import EmojiPicker from '$lib/components/EmojiPicker.svelte';
	import { CATEGORIES, type CategoryId } from '$lib/data/keywords';
	import { addItem } from '$lib/db/repo';

	interface Props {
		open: boolean;
		tripId: string;
		myProfileId: string;
		onclose: () => void;
	}

	let { open, tripId, myProfileId, onclose }: Props = $props();

	let name = $state('');
	let category = $state<CategoryId | null>(null);
	let emoji = $state('🎒');
	let emojiCustom = $state(false);
	let emojiOpen = $state(false);
	let neededCount = $state(1);
	let saving = $state(false);
	let errorMsg = $state<string | null>(null);
	let canSave = $derived(
		name.trim().length > 0 && category !== null && myProfileId.length > 0 && !saving
	);

	$effect(() => {
		if (open) {
			name = '';
			category = null;
			emoji = '🎒';
			emojiCustom = false;
			emojiOpen = false;
			neededCount = 1;
			saving = false;
			errorMsg = null;
		}
	});

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!canSave || !category) return;
		saving = true;
		errorMsg = null;
		try {
			await addItem(tripId, myProfileId, {
				name: name.trim(),
				emoji,
				category,
				neededCount
			});
			onclose();
		} catch (err) {
			console.error('Item anlegen fehlgeschlagen', err);
			errorMsg = 'Konnte nicht gespeichert werden – nochmal versuchen.';
			saving = false;
		}
	}
</script>

<Sheet {open} {onclose} title="Neuer Eintrag">
	<form onsubmit={submit} class="space-y-5">
		<div>
			<label
				for="new-item-name"
				class="micro-label micro-label-caps mb-2 block text-ink-soft dark:text-cream-soft"
			>
				Was wird gebraucht?
			</label>
			<div class="flex items-start gap-3">
				<button
					type="button"
					class="emoji-tile pressable h-14 w-14 shrink-0 text-[1.75rem] hover:ring-2 hover:ring-ember/35"
					onclick={() => (emojiOpen = !emojiOpen)}
					aria-label="Emoji ändern"
					aria-expanded={emojiOpen}
				>
					{emoji}
				</button>
				<input
					id="new-item-name"
					type="text"
					bind:value={name}
					use:focusOnMount
					placeholder="z. B. Campingkocher"
					autocomplete="off"
					class="input-soft min-w-0 flex-1"
				/>
			</div>
			{#if emojiOpen}
				<div class="group-list mt-3 p-2">
					<EmojiPicker
						value={emoji}
						onchange={(e) => {
							emoji = e;
							emojiCustom = true;
						}}
					/>
				</div>
			{/if}
		</div>

		<div>
			<span class="micro-label micro-label-caps mb-2 block text-ink-soft dark:text-cream-soft"
				>Kategorie</span
			>
			<div class="grid grid-cols-2 gap-2">
				{#each CATEGORIES as c (c.id)}
					<button
						type="button"
						onclick={() => {
							category = c.id;
							if (!emojiCustom) emoji = c.emoji;
						}}
						aria-pressed={category === c.id}
						class="pressable flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold {category ===
						c.id
							? 'bg-ink text-raised dark:bg-cream dark:text-night'
							: 'bg-raised/75 text-ink-soft ring-1 ring-line/60 hover:text-ink dark:bg-night-raised dark:text-cream-soft dark:ring-night-line'}"
					>
						<span aria-hidden="true">{c.emoji}</span>
						{c.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="group-list flex items-center justify-between gap-4 px-4 py-3">
			<span class="text-sm font-medium">Benötigte Anzahl</span>
			<div class="flex items-center gap-1">
				<button
					type="button"
					onclick={() => (neededCount = Math.max(1, neededCount - 1))}
					disabled={neededCount <= 1}
					aria-label="Weniger"
					class="pressable flex h-11 w-11 items-center justify-center rounded-full bg-sunken/70 disabled:opacity-35 dark:bg-night-sunken"
				>
					<Minus size={16} strokeWidth={1.75} />
				</button>
				<span
					class="w-8 text-center text-lg font-semibold tabular-nums tracking-tight"
					aria-live="polite">{neededCount}</span
				>
				<button
					type="button"
					onclick={() => (neededCount = Math.min(99, neededCount + 1))}
					disabled={neededCount >= 99}
					aria-label="Mehr"
					class="pressable flex h-11 w-11 items-center justify-center rounded-full bg-sunken/70 disabled:opacity-35 dark:bg-night-sunken"
				>
					<Plus size={16} strokeWidth={1.75} />
				</button>
			</div>
		</div>

		{#if errorMsg}
			<p role="alert" class="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
		{/if}

		<button type="submit" disabled={!canSave} class="btn-primary w-full">
			{saving ? 'Speichern …' : category ? 'Auf die Liste' : 'Bitte Kategorie wählen'}
		</button>
	</form>
</Sheet>
