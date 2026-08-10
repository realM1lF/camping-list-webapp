<script lang="ts">
	import { goto } from '$app/navigation';
	import { Bell } from 'lucide-svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import { myProfile, query } from '$lib/db/store';
	import { markAllNotificationsRead, markNotificationRead } from '$lib/db/repo';
	import type { AppNotification } from '$lib/types';
	import { haptic } from '$lib/motion/haptic';

	let open = $state(false);
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

	async function openSheet() {
		open = true;
		haptic('light');
		const ids = unread.map((n) => n.id);
		if (ids.length) await markAllNotificationsRead(ids);
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

	<Sheet {open} onclose={() => (open = false)} title="Benachrichtigungen">
		{#if items.length === 0}
			<p class="px-1 py-10 text-center text-sm text-ink-soft dark:text-cream-soft">
				Noch nichts Neues – Antworten und Erwähnungen erscheinen hier.
			</p>
		{:else}
			<ul class="group-list -mx-1 overflow-hidden">
				{#each items as n (n.id)}
					<li>
						<button
							type="button"
							class="pressable group-row flex min-h-[3.25rem] w-full flex-col items-start gap-0.5 px-4 py-3 text-left"
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
					</li>
				{/each}
			</ul>
		{/if}
	</Sheet>
{/if}
