<script lang="ts">
	import { CornerUpLeft, Send, Trash2, X } from 'lucide-svelte';
	import AvatarBadge from '$lib/components/AvatarBadge.svelte';
	import type { Comment, Item, Profile } from '$lib/types';
	import { addComment, deleteComment } from '$lib/db/repo';
	import { parseMentionIds } from '$lib/notify';
	import { haptic } from '$lib/motion/haptic';

	interface Props {
		item: Item;
		tripId: string;
		comments: Comment[];
		myProfileId: string;
		people: Profile[];
		authorName: string;
	}

	let { item, tripId, comments, myProfileId, people, authorName }: Props = $props();

	const timeFmt = new Intl.DateTimeFormat('de-DE', {
		hour: '2-digit',
		minute: '2-digit'
	});

	let draft = $state('');
	let listEl = $state<HTMLDivElement>();
	let inputEl = $state<HTMLTextAreaElement>();
	let replyTo = $state<Comment | null>(null);
	let mentionOpen = $state(false);
	let mentionQuery = $state('');

	let sorted = $derived([...comments].sort((a, b) => a.createdAt - b.createdAt));
	let count = $derived(sorted.length);
	let others = $derived(people.filter((p) => p.id !== myProfileId));
	let mentionHits = $derived(
		others
			.filter((p) => p.name.toLowerCase().includes(mentionQuery.toLowerCase()))
			.slice(0, 6)
	);

	$effect(() => {
		comments.length;
		if (listEl) listEl.scrollTop = listEl.scrollHeight;
	});

	function startReply(c: Comment) {
		replyTo = c;
		haptic('light');
		queueMicrotask(() => inputEl?.focus());
	}

	function cancelReply() {
		replyTo = null;
	}

	function insertMention(p: Profile) {
		const ta = inputEl;
		const at = draft.lastIndexOf('@');
		const before = at >= 0 ? draft.slice(0, at) : draft;
		const afterCursor = ta ? draft.slice(ta.selectionStart) : '';
		draft = `${before}@${p.name} `;
		mentionOpen = false;
		mentionQuery = '';
		queueMicrotask(() => {
			if (!inputEl) return;
			inputEl.focus();
			const pos = draft.length - afterCursor.length;
			inputEl.setSelectionRange(pos, pos);
		});
	}

	function onInput() {
		const ta = inputEl;
		if (!ta) return;
		const upto = draft.slice(0, ta.selectionStart);
		const m = upto.match(/(?:^|\s)@([^\s@]*)$/);
		if (m) {
			mentionOpen = true;
			mentionQuery = m[1] ?? '';
		} else {
			mentionOpen = false;
			mentionQuery = '';
		}
	}

	function send() {
		const text = draft.trim();
		if (!text) return;
		const mentionIds = parseMentionIds(text, others);
		addComment({
			itemId: item.id,
			authorId: myProfileId,
			text,
			replyToId: replyTo?.id,
			mentionIds,
			tripId,
			itemName: item.name,
			authorName,
			replyToAuthorId: replyTo?.author?.id ?? null,
			itemCreatedById: item.createdBy?.id ?? null,
			claimUserIds: (item.claims ?? []).map((c) => c.user?.id).filter(Boolean) as string[],
			people
		});
		draft = '';
		replyTo = null;
		mentionOpen = false;
		haptic('success');
	}

	function onKeydown(e: KeyboardEvent) {
		if (mentionOpen && mentionHits.length > 0 && e.key === 'ArrowDown') {
			e.preventDefault();
			return;
		}
		if (e.key === 'Escape' && (mentionOpen || replyTo)) {
			e.preventDefault();
			mentionOpen = false;
			if (replyTo) cancelReply();
			return;
		}
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (mentionOpen && mentionHits[0]) {
				insertMention(mentionHits[0]);
				return;
			}
			send();
		}
	}

	function preview(text: string, max = 72) {
		const t = text.replace(/\s+/g, ' ').trim();
		return t.length > max ? `${t.slice(0, max - 1)}…` : t;
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
					{@const quoted = c.replyTo}
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
								class="max-w-[min(85%,20rem)] px-3.5 py-2.5 text-[0.9rem] leading-snug break-words {mine
									? 'rounded-[1.15rem] rounded-br-md bg-ember text-white'
									: 'rounded-[1.15rem] rounded-bl-md bg-sunken/80 text-ink dark:bg-night-sunken dark:text-cream'}"
							>
								{#if quoted}
									<button
										type="button"
										class="mb-1.5 block w-full rounded-lg px-2.5 py-1.5 text-left text-[0.75rem] leading-snug {mine
											? 'bg-black/15 text-white/90'
											: 'bg-black/5 text-ink-soft dark:bg-white/8 dark:text-cream-soft'}"
										onclick={() => startReply(quoted)}
									>
										<span class="font-semibold">
											{quoted.author?.id === myProfileId ? 'Du' : (quoted.author?.name ?? 'Unbekannt')}
										</span>
										<span class="opacity-80"> · {preview(quoted.text, 56)}</span>
									</button>
								{/if}
								<span class="whitespace-pre-wrap">{c.text}</span>
							</div>
							<div class="flex flex-col gap-0.5 {mine ? 'items-end' : 'items-start'}">
								<button
									type="button"
									class="pressable -m-1 grid h-9 w-9 shrink-0 place-items-center text-ink-soft hover:text-ink focus-visible:opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 dark:text-cream-soft dark:hover:text-cream"
									onclick={() => startReply(c)}
									aria-label="Antworten"
								>
									<CornerUpLeft class="h-3.5 w-3.5" strokeWidth={1.75} />
								</button>
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
					</div>
				{/each}
			</div>
		{/if}

		<div class="relative mt-3 border-t border-line/60 pt-3 dark:border-night-line">
			{#if replyTo}
				<div
					class="mb-2 flex items-start gap-2 rounded-2xl bg-sunken/70 px-3 py-2 dark:bg-night-sunken/80"
				>
					<div class="min-w-0 flex-1">
						<p class="text-[0.7rem] font-semibold tracking-tight text-ember">
							Antwort an {replyTo.author?.id === myProfileId
								? 'dich'
								: (replyTo.author?.name ?? 'Unbekannt')}
						</p>
						<p class="truncate text-[0.8rem] text-ink-soft dark:text-cream-soft">
							{preview(replyTo.text)}
						</p>
					</div>
					<button
						type="button"
						class="pressable grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft dark:text-cream-soft"
						onclick={cancelReply}
						aria-label="Antwort abbrechen"
					>
						<X class="h-4 w-4" strokeWidth={1.75} />
					</button>
				</div>
			{/if}

			{#if mentionOpen && mentionHits.length > 0}
				<ul
					class="menu-surface absolute right-0 bottom-full left-0 z-20 mb-2 max-h-48 overflow-y-auto rounded-2xl p-1.5 shadow-[var(--shadow-soft)]"
					role="listbox"
					aria-label="Personen erwähnen"
				>
					{#each mentionHits as p (p.id)}
						<li>
							<button
								type="button"
								role="option"
								aria-selected="false"
								class="pressable flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-sm"
								onclick={() => insertMention(p)}
							>
								<AvatarBadge name={p.name} src={p.avatar?.url} size="sm" />
								<span class="font-medium">{p.name}</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}

			<div class="flex items-end gap-2">
				<textarea
					bind:this={inputEl}
					bind:value={draft}
					oninput={onInput}
					onkeydown={onKeydown}
					rows="1"
					placeholder={replyTo ? 'Antwort schreiben …' : 'Frage, @Name oder Notiz …'}
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
	</div>
</section>
