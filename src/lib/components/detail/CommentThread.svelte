<script lang="ts">
	import { Send, Trash2 } from 'lucide-svelte';
	import AvatarBadge from '$lib/components/AvatarBadge.svelte';
	import type { Comment } from '$lib/types';
	import { addComment, deleteComment } from '$lib/db/repo';
	import { haptic } from '$lib/motion/haptic';

	interface Props {
		itemId: string;
		comments: Comment[];
		myProfileId: string;
	}

	let { itemId, comments, myProfileId }: Props = $props();

	const timeFmt = new Intl.DateTimeFormat('de-DE', {
		hour: '2-digit',
		minute: '2-digit'
	});

	let draft = $state('');
	let listEl = $state<HTMLDivElement>();

	let sorted = $derived([...comments].sort((a, b) => a.createdAt - b.createdAt));
	let count = $derived(sorted.length);

	$effect(() => {
		comments.length;
		if (listEl) listEl.scrollTop = listEl.scrollHeight;
	});

	function send() {
		const text = draft.trim();
		if (!text) return;
		addComment(itemId, myProfileId, text);
		draft = '';
		haptic('success');
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}
</script>

<section aria-labelledby="chat-heading">
	<header class="mb-3 flex items-baseline justify-between gap-2 px-0.5">
		<h3 id="chat-heading" class="text-base font-semibold tracking-tight">Fragen & Notizen</h3>
		<span class="micro-label micro-label-caps text-ink-soft dark:text-cream-soft">{count}</span>
	</header>

	<div class="group-list p-3">
		{#if count === 0}
			<p class="px-2 py-8 text-center text-sm text-ink-soft dark:text-cream-soft">
				Noch keine Fragen – schreib die erste.
			</p>
		{:else}
			<div bind:this={listEl} class="max-h-64 space-y-3.5 overflow-y-auto overflow-x-hidden px-0.5">
				{#each sorted as c (c.id)}
					{@const mine = c.author?.id === myProfileId}
					<div class="group flex flex-col {mine ? 'items-end' : 'items-start'}">
						<div class="mb-1 flex items-center gap-1.5 text-ink-soft dark:text-cream-soft">
							{#if !mine && c.author}
								<AvatarBadge name={c.author.name} src={c.author.avatar?.url} size="sm" />
							{/if}
							<span class="text-[0.7rem] font-semibold tracking-tight">
								{mine ? 'Du' : (c.author?.name ?? 'Unbekannt')}
							</span>
							<span class="text-[0.65rem] tabular-nums opacity-55">
								{timeFmt.format(c.createdAt)}
							</span>
						</div>
						<div class="flex max-w-full items-start gap-1 {mine ? 'flex-row-reverse' : ''}">
							<div
								class="max-w-[min(85%,20rem)] px-3.5 py-2.5 text-[0.9rem] leading-snug break-words whitespace-pre-wrap {mine
									? 'rounded-[1.15rem] rounded-br-md bg-ember text-white'
									: 'rounded-[1.15rem] rounded-bl-md bg-sunken/80 text-ink dark:bg-night-sunken dark:text-cream'}"
							>
								{c.text}
							</div>
							{#if mine}
								<button
									type="button"
									class="pressable -m-1 grid h-9 w-9 shrink-0 place-items-center text-ink-soft hover:text-ember-deep focus-visible:opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 dark:text-cream-soft"
									onclick={() => deleteComment(c.id)}
									aria-label="Nachricht löschen"
								>
									<Trash2 class="h-3.5 w-3.5" strokeWidth={1.75} />
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div class="mt-3 flex items-end gap-2 border-t border-line/60 pt-3 dark:border-night-line">
			<textarea
				bind:value={draft}
				onkeydown={onKeydown}
				rows="1"
				placeholder="Frage oder Notiz …"
				aria-label="Nachricht schreiben"
				class="input-soft min-h-11 max-h-32 flex-1 resize-y !rounded-[1.15rem] !shadow-none py-2.5 text-sm leading-normal ring-1 ring-line/50 dark:ring-night-line"
			></textarea>
			<button
				type="button"
				class="pressable grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-raised disabled:opacity-35 dark:bg-cream dark:text-night"
				onclick={send}
				disabled={!draft.trim()}
				aria-label="Nachricht senden"
			>
				<Send class="h-4 w-4" strokeWidth={1.75} />
			</button>
		</div>
	</div>
</section>
