<script lang="ts">
	import { MessageCircle, ChevronRight } from 'lucide-svelte';
	import AvatarBadge from '$lib/components/AvatarBadge.svelte';
	import { claimedCount, getItemStatus, STATUS_META } from '$lib/status';
	import type { Item, ItemStatus } from '$lib/types';

	interface Props {
		item: Item;
		compact?: boolean;
		onselect: (item: Item) => void;
	}

	let { item, compact = false, onselect }: Props = $props();

	const STATUS_CLASS: Record<ItemStatus, string> = {
		open: 'status-open',
		partial: 'status-partial',
		covered: 'status-covered'
	};

	let status = $derived(getItemStatus(item));
	let claims = $derived(item.claims ?? []);
	let claimants = $derived(
		claims
			.map((c) => c.user)
			.filter((u): u is NonNullable<typeof u> => Boolean(u))
			.filter((u, i, all) => all.findIndex((x) => x.id === u.id) === i)
	);
	let visibleClaimants = $derived(claimants.slice(0, 3));
	let overflow = $derived(Math.max(0, claimants.length - visibleClaimants.length));
	let commentCount = $derived(item.comments?.length ?? 0);
	let progress = $derived(`${claimedCount(item)}/${item.neededCount || 1}`);
	let pressed = $state(false);
</script>

<button
	type="button"
	class="group-row {compact ? 'min-h-12 gap-3 px-3.5 py-2' : 'min-h-[4.25rem] gap-3.5 px-4 py-3'}"
	class:is-pressed={pressed}
	aria-label={`${item.name}, ${STATUS_META[status].label}, ${progress} zugesagt`}
	onpointerdown={(e) => {
		if (e.button === 0) pressed = true;
	}}
	onpointerup={() => (pressed = false)}
	onpointercancel={() => (pressed = false)}
	onpointerleave={() => (pressed = false)}
	onclick={() => onselect(item)}
>
	<span
		class="emoji-tile {compact ? 'h-9 w-9 text-base' : 'h-11 w-11 text-[1.35rem]'}"
		aria-hidden="true"
	>
		{item.emoji}
	</span>

	<span class="min-w-0 flex-1">
		<span
			class="block truncate font-semibold tracking-tight text-ink dark:text-cream {compact
				? 'text-sm'
				: 'text-[0.95rem]'}"
		>
			{item.name}
		</span>
		{#if !compact}
			<span class="mt-0.5 flex items-center gap-2 text-[0.8rem]">
				<span class="font-semibold tabular-nums {STATUS_CLASS[status]}">{progress}</span>
				<span class="text-ink-soft dark:text-cream-soft">{STATUS_META[status].label}</span>
			</span>
		{/if}
	</span>

	{#if compact}
		<span class="shrink-0 text-xs font-bold tabular-nums {STATUS_CLASS[status]}">{progress}</span>
	{/if}

	{#if claimants.length > 0}
		<span class="flex shrink-0 -space-x-1.5">
			{#each visibleClaimants as user (user.id)}
				<span class="rounded-full ring-2 ring-raised dark:ring-night-raised">
					<AvatarBadge name={user.name} src={user.avatar?.url} size="sm" />
				</span>
			{/each}
			{#if overflow > 0}
				<span
					class="flex h-6 w-6 items-center justify-center rounded-full bg-sunken text-[0.625rem] font-semibold text-ink-soft ring-2 ring-raised dark:bg-night-sunken dark:text-cream-soft dark:ring-night-raised"
				>
					+{overflow}
				</span>
			{/if}
		</span>
	{/if}

	{#if commentCount > 0}
		<span
			class="flex shrink-0 items-center gap-1 text-ink-soft dark:text-cream-soft {compact
				? 'text-[0.7rem]'
				: 'text-xs'}"
			title="{commentCount} Kommentar{commentCount === 1 ? '' : 'e'}"
		>
			<MessageCircle size={compact ? 13 : 15} strokeWidth={1.75} />
			<span class="font-semibold tabular-nums">{commentCount}</span>
		</span>
	{/if}

	{#if !compact}
		<ChevronRight
			size={16}
			strokeWidth={1.75}
			class="shrink-0 text-ink-soft/50 dark:text-cream-soft/40"
			aria-hidden="true"
		/>
	{/if}
</button>
