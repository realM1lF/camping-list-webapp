<script lang="ts">
	import { Check, Minus, Plus, X } from 'lucide-svelte';
	import Sheet from '../Sheet.svelte';
	import AvatarBadge from '../AvatarBadge.svelte';
	import EmojiPicker from '../EmojiPicker.svelte';
	import CommentThread from './CommentThread.svelte';
	import type { Item, ItemStatus } from '$lib/types';
	import { claimedCount, getItemStatus } from '$lib/status';
	import { CATEGORIES, categoryLabel } from '$lib/data/keywords';
	import { claimItem, deleteItem, unclaimItem, updateClaimCount, updateItem } from '$lib/db/repo';
	import { haptic } from '$lib/motion/haptic';

	interface Props {
		item: Item;
		myProfileId: string;
		open: boolean;
		onclose: () => void;
	}

	let { item, myProfileId, open, onclose }: Props = $props();

	const BADGE: Record<ItemStatus, string> = {
		open: 'bg-ember-soft text-ember-deep dark:text-ember',
		partial: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
		covered: 'bg-moss-soft text-moss'
	};

	let confirmingDelete = $state(false);
	let emojiOpen = $state(false);

	let claims = $derived(item.claims ?? []);
	let claimed = $derived(claimedCount(item));
	let needed = $derived(item.neededCount || 1);
	let status = $derived(getItemStatus(item));
	let statusLabel = $derived(
		status === 'open' ? 'Offen' : status === 'partial' ? 'Teilweise' : 'Versorgt'
	);
	let myClaim = $derived(claims.find((c) => c.user?.id === myProfileId));
	let myCount = $derived(myClaim?.count || 0);
	let isCreator = $derived(item.createdBy?.id === myProfileId);
	let sortedClaims = $derived(
		[...claims].sort(
			(a, b) =>
				(b.count || 1) - (a.count || 1) ||
				(a.user?.name ?? '').localeCompare(b.user?.name ?? '', 'de')
		)
	);
	let claimNames = $derived(sortedClaims.map((c) => c.user?.name ?? 'Unbekannt').join(', '));

	$effect(() => {
		if (!open) {
			confirmingDelete = false;
			emojiOpen = false;
		}
	});

	function removeItem() {
		deleteItem(
			item.id,
			claims.map((c) => c.id),
			(item.comments ?? []).map((c) => c.id)
		);
		onclose();
	}

	function bumpMyClaim(delta: number) {
		const next = myCount + delta;
		if (!myClaim) {
			if (next >= 1) {
				claimItem(item.id, myProfileId, 1);
				haptic('success');
			}
			return;
		}
		if (next < 1) {
			unclaimItem(myClaim.id);
			haptic('light');
			return;
		}
		updateClaimCount(myClaim.id, Math.min(99, next));
		haptic(delta > 0 ? 'medium' : 'light');
	}
</script>

<Sheet {open} {onclose}>
	<div class="flex flex-col gap-6">
		<!-- Header: full-width title, no squeeze beside badge -->
		<header class="relative">
			<button
				type="button"
				class="pressable icon-btn absolute top-0 right-0 z-10 h-11 w-11 hover:bg-sunken/70 hover:text-ink dark:hover:bg-night-sunken dark:hover:text-cream"
				onclick={onclose}
				aria-label="Schließen"
			>
				<X class="h-4 w-4" strokeWidth={1.75} />
			</button>

			<div class="flex gap-3.5 pr-12">
				{#if isCreator}
					<button
						type="button"
						class="emoji-tile pressable h-14 w-14 shrink-0 text-[1.75rem] hover:ring-2 hover:ring-ember/35"
						onclick={() => (emojiOpen = !emojiOpen)}
						aria-label="Emoji ändern"
						aria-expanded={emojiOpen}
					>
						{item.emoji}
					</button>
				{:else}
					<div class="emoji-tile h-14 w-14 shrink-0 text-[1.75rem]" aria-hidden="true">
						{item.emoji}
					</div>
				{/if}

				<div class="min-w-0 flex-1 pt-0.5">
					<h2
						class="text-[1.375rem] leading-snug font-semibold tracking-tight text-balance break-words hyphens-auto"
					>
						{item.name}
					</h2>
					<div class="mt-2 flex flex-wrap items-center gap-2">
						<span
							class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold {BADGE[
								status
							]}"
							title="{statusLabel}: {claimed}/{needed}"
						>
							{#if status === 'covered'}
								<Check class="h-3 w-3" strokeWidth={2.25} />
							{/if}
							<span class="tabular-nums">{claimed}/{needed}</span>
						</span>
						<span class="text-[0.8125rem] text-ink-soft dark:text-cream-soft">
							{categoryLabel(item.category)}
							<span class="mx-1 opacity-40">·</span>
							{statusLabel}
						</span>
					</div>
				</div>
			</div>

			<div
				class="mt-4 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-[0.8125rem] text-ink-soft dark:text-cream-soft"
			>
				{#if item.createdBy}
					<span class="inline-flex min-w-0 items-center gap-1.5">
						<span class="shrink-0 opacity-70">von</span>
						<AvatarBadge
							name={item.createdBy.name}
							src={item.createdBy.avatar?.url}
							size="sm"
						/>
						<span class="truncate font-medium text-ink dark:text-cream">
							{item.createdBy.name}
						</span>
					</span>
				{/if}

				{#if sortedClaims.length > 0}
					<span
						class="inline-flex min-w-0 items-center gap-1.5"
						title="Bringt mit: {claimNames}"
					>
						<span class="shrink-0 opacity-70">bringt</span>
						<span class="flex -space-x-1.5">
							{#each sortedClaims as claim (claim.id)}
								{@const count = claim.count || 1}
								<span
									class="relative inline-flex rounded-full ring-2 ring-raised dark:ring-night-raised"
								>
									<AvatarBadge
										name={claim.user?.name ?? '?'}
										src={claim.user?.avatar?.url}
										size="sm"
									/>
									{#if count > 1}
										<span
											class="absolute -right-1 -bottom-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-ember px-0.5 text-[0.55rem] font-bold text-white"
										>
											{count}
										</span>
									{/if}
								</span>
							{/each}
						</span>
					</span>
				{:else}
					<span class="opacity-70">noch niemand</span>
				{/if}
			</div>
		</header>

		{#if emojiOpen && isCreator}
			<div class="group-list p-2">
				<EmojiPicker
					value={item.emoji}
					onchange={(e) => {
						updateItem(item.id, { emoji: e });
						emojiOpen = false;
					}}
				/>
			</div>
		{/if}

		<section class="group-list px-4 py-3.5">
			<div class="flex items-center justify-between gap-3">
				<div class="min-w-0">
					<p class="text-[0.95rem] font-semibold text-ink dark:text-cream">
						{myClaim ? 'Bringst du mit' : 'Bring ich mit'}
					</p>
					<p class="mt-0.5 text-[0.75rem] text-ink-soft dark:text-cream-soft">
						{myClaim ? 'Deine Zusage' : 'Tippe +, um zuzusagen'}
					</p>
				</div>
				<div class="flex items-center gap-1">
					<button
						type="button"
						class="pressable grid h-11 w-11 place-items-center rounded-full bg-sunken/80 text-ink disabled:opacity-35 dark:bg-night-sunken dark:text-cream"
						disabled={myCount <= 0}
						onclick={() => bumpMyClaim(-1)}
						aria-label="Eins weniger mitbringen"
					>
						<Minus class="h-4 w-4" strokeWidth={1.75} />
					</button>
					<span
						class="inline-block w-9 text-center text-[1.35rem] font-semibold tabular-nums tracking-tight text-ember-deep dark:text-ember"
					>
						{myCount}
					</span>
					<button
						type="button"
						class="pressable grid h-11 w-11 place-items-center rounded-full bg-sunken/80 text-ink disabled:opacity-35 dark:bg-night-sunken dark:text-cream"
						disabled={myCount >= 99}
						onclick={() => bumpMyClaim(1)}
						aria-label="Eins mehr mitbringen"
					>
						<Plus class="h-4 w-4" strokeWidth={1.75} />
					</button>
				</div>
			</div>
		</section>

		{#if isCreator}
			<!-- Secondary control: quieter than claim -->
			<section class="group-list">
				<div class="flex items-center justify-between gap-3 px-4 py-2.5">
					<span class="text-[0.8125rem] text-ink-soft dark:text-cream-soft">Benötigt</span>
					<div class="flex items-center gap-0.5">
						<button
							type="button"
							class="pressable grid h-11 w-11 place-items-center rounded-full text-ink-soft hover:bg-sunken/60 disabled:opacity-35 dark:text-cream-soft dark:hover:bg-night-sunken"
							disabled={needed <= 1}
							onclick={() => updateItem(item.id, { neededCount: needed - 1 })}
							aria-label="Weniger benötigt"
						>
							<Minus class="h-3.5 w-3.5" strokeWidth={1.75} />
						</button>
						<span
							class="w-7 text-center text-[0.9375rem] font-medium tabular-nums text-ink-soft dark:text-cream-soft"
							>{needed}</span
						>
						<button
							type="button"
							class="pressable grid h-11 w-11 place-items-center rounded-full text-ink-soft hover:bg-sunken/60 disabled:opacity-35 dark:text-cream-soft dark:hover:bg-night-sunken"
							disabled={needed >= 99}
							onclick={() => updateItem(item.id, { neededCount: needed + 1 })}
							aria-label="Mehr benötigt"
						>
							<Plus class="h-3.5 w-3.5" strokeWidth={1.75} />
						</button>
					</div>
				</div>
			</section>

			<section>
				<p class="mb-2 px-1 text-[0.8125rem] text-ink-soft dark:text-cream-soft">Kategorie</p>
				<div class="grid grid-cols-2 gap-2">
					{#each CATEGORIES as c (c.id)}
						<button
							type="button"
							class="pressable flex min-h-11 items-center justify-center gap-1.5 rounded-2xl px-2 text-sm font-semibold {item.category ===
							c.id
								? 'bg-ink text-raised dark:bg-cream dark:text-night'
								: 'bg-raised/75 text-ink-soft ring-1 ring-line/60 hover:text-ink dark:bg-night-raised dark:text-cream-soft dark:ring-night-line dark:hover:text-cream'}"
							onclick={() => updateItem(item.id, { category: c.id })}
							aria-pressed={item.category === c.id}
						>
							<span aria-hidden="true">{c.emoji}</span>
							<span class="truncate">{c.label}</span>
						</button>
					{/each}
				</div>
			</section>
		{/if}

		<CommentThread itemId={item.id} comments={item.comments ?? []} {myProfileId} />

		{#if isCreator}
			<!-- iOS-style destructive action: last, plain, centered -->
			<footer class="border-t border-line/40 pt-4 pb-1 dark:border-night-line/50">
				{#if confirmingDelete}
					<div class="px-1 text-center">
						<p class="text-sm leading-relaxed text-ink-soft dark:text-cream-soft">
							„{item.name}“ löschen? Zusagen und Kommentare gehen verloren.
						</p>
						<div class="mt-3 flex justify-center gap-6">
							<button
								type="button"
								class="pressable min-h-11 px-2 text-[0.9375rem] font-semibold text-ink-soft dark:text-cream-soft"
								onclick={() => (confirmingDelete = false)}
							>
								Abbrechen
							</button>
							<button
								type="button"
								class="pressable min-h-11 px-2 text-[0.9375rem] font-semibold text-red-600 dark:text-red-400"
								onclick={removeItem}
							>
								Löschen
							</button>
						</div>
					</div>
				{:else}
					<button
						type="button"
						class="pressable mx-auto flex min-h-11 w-full items-center justify-center text-[0.9375rem] font-normal text-red-600 dark:text-red-400"
						onclick={() => (confirmingDelete = true)}
					>
						Eintrag löschen
					</button>
				{/if}
			</footer>
		{/if}
	</div>
</Sheet>
