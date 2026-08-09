<script lang="ts">
	import { browser } from '$app/environment';
	import { Share, MoreVertical, Plus, Smartphone } from 'lucide-svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import {
		dismissInstallHint,
		getInstallPlatform,
		shouldShowInstallHint,
		type InstallPlatform
	} from '$lib/install';

	interface Props {
		name: string;
	}

	let { name }: Props = $props();

	let open = $state(false);
	let platform = $state<InstallPlatform>('other');

	let vorname = $derived(name.trim().split(/\s+/)[0] ?? '');

	$effect(() => {
		if (!browser) return;
		platform = getInstallPlatform();
		if (!shouldShowInstallHint()) {
			open = false;
			return;
		}
		// Kurze Pause nach Login/Profil — wirkt ruhiger als sofort
		const id = window.setTimeout(() => {
			open = true;
		}, 600);
		return () => clearTimeout(id);
	});

	function close() {
		dismissInstallHint();
		open = false;
	}
</script>

<Sheet {open} onclose={close} title="Als App nutzen">
	<div class="flex flex-col gap-5 pb-1">
		<div class="flex items-start gap-3">
			<span
				class="emoji-tile grid h-12 w-12 shrink-0 place-items-center text-ink-soft dark:text-cream-soft"
				aria-hidden="true"
			>
				<Smartphone size={22} strokeWidth={1.75} />
			</span>
			<div class="min-w-0 pt-0.5">
				<p class="text-[1.05rem] font-semibold tracking-tight text-ink dark:text-cream">
					{#if vorname}Hi {vorname}, bevor du loslegst:{:else}Bevor du loslegst:{/if}
				</p>
				<p class="mt-1.5 text-[0.9rem] leading-relaxed text-ink-soft dark:text-cream-soft">
					Leg Camping-Planner auf den Homescreen. Dann öffnest du ihn wie eine normale App, ohne
					jedes Mal den Browser nutzen zu müssen.
				</p>
			</div>
		</div>

		{#if platform === 'ios'}
			<ol class="group-list divide-y divide-line/50 dark:divide-night-line/60">
				<li class="flex gap-3 px-4 py-3.5">
					<span
						class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-bold tabular-nums text-ink dark:bg-night-sunken dark:text-cream"
						>1</span
					>
					<p class="min-w-0 text-[0.9rem] leading-snug text-ink dark:text-cream">
						Tippe unten auf
						<span class="inline-flex items-center gap-1 font-semibold">
							Teilen
							<Share size={15} strokeWidth={1.75} class="inline text-ink-soft dark:text-cream-soft" />
						</span>
						(Quadrat mit Pfeil).
					</p>
				</li>
				<li class="flex gap-3 px-4 py-3.5">
					<span
						class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-bold tabular-nums text-ink dark:bg-night-sunken dark:text-cream"
						>2</span
					>
					<p class="min-w-0 text-[0.9rem] leading-snug text-ink dark:text-cream">
						Wähle
						<span class="font-semibold">„Zum Home-Bildschirm“</span>
						<span class="inline-flex items-center text-ink-soft dark:text-cream-soft">
							(<Plus size={14} strokeWidth={2} class="inline" />).
						</span>
					</p>
				</li>
				<li class="flex gap-3 px-4 py-3.5">
					<span
						class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-bold tabular-nums text-ink dark:bg-night-sunken dark:text-cream"
						>3</span
					>
					<p class="min-w-0 text-[0.9rem] leading-snug text-ink dark:text-cream">
						Tippe auf <span class="font-semibold">Hinzufügen</span>. Fertig. Am besten in
						<span class="font-semibold">Safari</span>.
					</p>
				</li>
			</ol>
		{:else if platform === 'android'}
			<ol class="group-list divide-y divide-line/50 dark:divide-night-line/60">
				<li class="flex gap-3 px-4 py-3.5">
					<span
						class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-bold tabular-nums text-ink dark:bg-night-sunken dark:text-cream"
						>1</span
					>
					<p class="min-w-0 text-[0.9rem] leading-snug text-ink dark:text-cream">
						Tippe oben rechts auf
						<span class="inline-flex items-center gap-1 font-semibold">
							Menü
							<MoreVertical size={15} strokeWidth={1.75} class="inline text-ink-soft dark:text-cream-soft" />
						</span>
						(drei Punkte).
					</p>
				</li>
				<li class="flex gap-3 px-4 py-3.5">
					<span
						class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-bold tabular-nums text-ink dark:bg-night-sunken dark:text-cream"
						>2</span
					>
					<p class="min-w-0 text-[0.9rem] leading-snug text-ink dark:text-cream">
						Wähle
						<span class="font-semibold">„App installieren“</span>
						oder
						<span class="font-semibold">„Zum Startbildschirm hinzufügen“</span>.
					</p>
				</li>
				<li class="flex gap-3 px-4 py-3.5">
					<span
						class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-bold tabular-nums text-ink dark:bg-night-sunken dark:text-cream"
						>3</span
					>
					<p class="min-w-0 text-[0.9rem] leading-snug text-ink dark:text-cream">
						Bestätige mit <span class="font-semibold">Installieren</span>. Danach liegt
						Camping-Planner wie eine App auf dem Homescreen.
					</p>
				</li>
			</ol>
		{/if}

		<button type="button" class="btn-primary w-full" onclick={close}>Alles klar</button>
		<p class="text-center text-[0.75rem] leading-relaxed text-ink-soft dark:text-cream-soft">
			Diesen Hinweis siehst du nur einmal. Die App funktioniert auch im Browser.
		</p>
	</div>
</Sheet>
