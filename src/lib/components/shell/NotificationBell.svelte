<script lang="ts">
	import { goto } from '$app/navigation';
	import { Bell, X } from 'lucide-svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import { myProfile, query } from '$lib/db/store';
	import { deleteNotifications, markAllNotificationsRead, markNotificationRead } from '$lib/db/repo';
	import type { AppNotification } from '$lib/types';
	import { haptic } from '$lib/motion/haptic';

	let {
		open = $bindable(false),
		part = 'all'
	}: {
		open?: boolean;
		part?: 'button' | 'sheet' | 'all';
	} = $props();

	let items = $state<AppNotification[]>([]);

	$effect(() => {
		const pid = $myProfile?.id;
		if (!pid) {
			items = [];
			return;
		}
		const q = query<{ notifications: AppNotification[] }>({
			notifications: {
				$: {
					where: { 'recipient.id': pid },
					order: { createdAt: 'desc' },
					limit: 40
				}
			}
		} as never);
		return q.subscribe((s) => {
			items = [...(s.data?.notifications ?? [])].sort((a, b) => b.createdAt - a.createdAt);
		});
	});

	let unread = $derived(items.filter((n) => !n.read));
	let unreadCount = $derived(unread.length);

	const relFmt = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });

	function relative(ts: number) {
		const diffSec = Math.round((ts - Date.now()) / 1000);
		const abs = Math.abs(diffSec);
		if (abs < 60) return relFmt.format(diffSec, 'second');
		const diffMin = Math.round(diffSec / 60);
		if (Math.abs(diffMin) < 60) return relFmt.format(diffMin, 'minute');
		const diffH = Math.round(diffMin / 60);
		if (Math.abs(diffH) < 48) return relFmt.format(diffH, 'hour');
		return relFmt.format(Math.round(diffH / 24), 'day');
	}

	function openSheet() {
		open = true;
		haptic('light');
	}

	let confirmClear = $state(false);

	async function markAllRead() {
		const ids = unread.map((n) => n.id);
		if (ids.length) await markAllNotificationsRead(ids);
	}

	async function clearAll() {
		const ids = items.map((n) => n.id);
		if (!ids.length) return;
		await deleteNotifications(ids);
		confirmClear = false;
		haptic('light');
	}

	async function dismissOne(id: string, e: Event) {
		e.stopPropagation();
		await deleteNotifications([id]);
		haptic('light');
	}

	async function openNotif(n: AppNotification) {
		if (!n.read) await markNotificationRead(n.id);
		open = false;
		if (n.tripId) {
			const url =
				n.itemId != null ? `/trip/${n.tripId}?item=${n.itemId}` : `/trip/${n.tripId}`;
			await goto(url);
		}
	}
</script>

{#if $myProfile}
	{#if part === 'button' || part === 'all'}
	<button
		type="button"
		onclick={openSheet}
		class="pressable relative flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-white/45 dark:text-cream dark:hover:bg-night-raised"
		aria-label={unreadCount > 0 ? `Benachrichtigungen, ${unreadCount} neu` : 'Benachrichtigungen'}
	>
		<Bell size={20} strokeWidth={1.75} />
		{#if unreadCount > 0}
			<span
				class="absolute top-1.5 right-1.5 grid min-w-[1.1rem] place-items-center rounded-full bg-ember px-1 text-[0.65rem] font-bold leading-none text-white"
				aria-hidden="true"
			>
				{unreadCount > 9 ? '9+' : unreadCount}
			</span>
		{/if}
	</button>
	{/if}

	{#if part === 'sheet' || part === 'all'}
	<Sheet
		{open}
		onclose={() => {
			open = false;
			confirmClear = false;
		}}
		title="Benachrichtigungen"
	>
		{#if items.length === 0}
			<p class="px-1 py-10 text-center text-sm text-ink-soft dark:text-cream-soft">
				Noch nichts Neues – Antworten und Erwähnungen erscheinen hier.
			</p>
		{:else}
			<div class="mb-2 flex gap-2">
				{#if unreadCount > 0}
					<button
						type="button"
						class="pressable min-h-11 flex-1 rounded-2xl px-3 text-sm font-semibold text-ink-soft hover:bg-sunken/60 dark:text-cream-soft dark:hover:bg-night-sunken"
						onclick={markAllRead}
					>
						Alle gelesen
					</button>
				{/if}
				{#if confirmClear}
					<button
						type="button"
						class="pressable min-h-11 flex-1 rounded-2xl px-3 text-sm font-semibold text-red-600 dark:text-red-400"
						onclick={clearAll}
					>
						Wirklich leeren
					</button>
					<button
						type="button"
						class="pressable min-h-11 flex-1 rounded-2xl px-3 text-sm font-medium text-ink-soft dark:text-cream-soft"
						onclick={() => (confirmClear = false)}
					>
						Abbrechen
					</button>
				{:else}
					<button
						type="button"
						class="pressable min-h-11 flex-1 rounded-2xl px-3 text-sm font-semibold text-ink-soft hover:bg-sunken/60 dark:text-cream-soft dark:hover:bg-night-sunken"
						onclick={() => (confirmClear = true)}
					>
						Alle leeren
					</button>
				{/if}
			</div>
			<ul class="group-list -mx-1 overflow-hidden">
				{#each items as n (n.id)}
					<li class="flex items-stretch">
						<button
							type="button"
							class="pressable group-row min-h-[3.25rem] min-w-0 flex-1 flex-col items-start gap-0.5 px-4 py-3 text-left"
							onclick={() => openNotif(n)}
						>
							<div class="flex w-full items-baseline justify-between gap-3">
								<p
									class="min-w-0 flex-1 text-[0.9375rem] leading-snug {n.read
										? 'font-medium text-ink dark:text-cream'
										: 'font-semibold text-ink dark:text-cream'}"
								>
									{n.title}
								</p>
								<span class="shrink-0 text-[0.7rem] text-ink-soft tabular-nums dark:text-cream-soft">
									{relative(n.createdAt)}
								</span>
							</div>
							<p class="line-clamp-2 text-sm leading-snug text-ink-soft dark:text-cream-soft">
								{n.body}
							</p>
						</button>
						<button
							type="button"
							class="pressable grid w-11 shrink-0 place-items-center text-ink-soft hover:text-ink dark:text-cream-soft dark:hover:text-cream"
							onclick={(e) => dismissOne(n.id, e)}
							aria-label="Benachrichtigung entfernen"
						>
							<X size={16} strokeWidth={1.75} />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</Sheet>
	{/if}
{/if}
