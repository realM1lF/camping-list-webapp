<script lang="ts">
	import { Camera } from 'lucide-svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import AvatarBadge from '$lib/components/AvatarBadge.svelte';
	import { auth, myProfile } from '$lib/db/store';
	import { setProfileAvatar, updateNotifPrefs, updateProfileName } from '$lib/db/repo';
	import { prefOn } from '$lib/types';
	import { clearPushSubscription, ensurePushSubscription, pushConfigured } from '$lib/push';
	import { haptic } from '$lib/motion/haptic';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open, onclose }: Props = $props();

	let name = $state('');
	let busy = $state(false);
	let error = $state<string | null>(null);
	let localPreview = $state<string | null>(null);
	let pushBusy = $state(false);
	let pushError = $state<string | null>(null);

	$effect(() => {
		if (open && $myProfile) {
			name = $myProfile.name;
			error = null;
			busy = false;
			pushError = null;
			if (localPreview) {
				URL.revokeObjectURL(localPreview);
				localPreview = null;
			}
		}
	});

	let avatarSrc = $derived(localPreview ?? $myProfile?.avatar?.url ?? null);
	let notifyReplies = $derived(prefOn($myProfile?.notifyReplies));
	let notifyMentions = $derived(prefOn($myProfile?.notifyMentions));
	let notifyItemActivity = $derived(prefOn($myProfile?.notifyItemActivity));
	let pushOn = $derived(Boolean($myProfile?.pushSubscription));
	let canPush = $derived(pushConfigured());

	async function onPick(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		const uid = $auth.user?.id;
		const pid = $myProfile?.id;
		if (!file || !uid || !pid || busy) return;
		busy = true;
		error = null;
		if (localPreview) URL.revokeObjectURL(localPreview);
		localPreview = URL.createObjectURL(file);
		try {
			await setProfileAvatar(uid, pid, file);
		} catch {
			error = 'Bild konnte nicht hochgeladen werden.';
			if (localPreview) URL.revokeObjectURL(localPreview);
			localPreview = null;
		} finally {
			busy = false;
			(e.currentTarget as HTMLInputElement).value = '';
		}
	}

	async function speichern(e: SubmitEvent) {
		e.preventDefault();
		const pid = $myProfile?.id;
		if (!pid || !name.trim() || busy) return;
		busy = true;
		error = null;
		try {
			await updateProfileName(pid, name.trim());
			onclose();
		} catch {
			error = 'Name konnte nicht gespeichert werden.';
		} finally {
			busy = false;
		}
	}

	async function setPref(
		key: 'notifyReplies' | 'notifyMentions' | 'notifyItemActivity',
		value: boolean
	) {
		const pid = $myProfile?.id;
		if (!pid) return;
		haptic('light');
		await updateNotifPrefs(pid, { [key]: value });
	}

	async function togglePush() {
		const pid = $myProfile?.id;
		if (!pid || pushBusy || !canPush) return;
		pushBusy = true;
		pushError = null;
		try {
			if (pushOn) {
				await clearPushSubscription(pid);
			} else {
				const ok = await ensurePushSubscription(pid);
				if (!ok) pushError = 'Berechtigung fehlt oder Gerät unterstützt kein Push.';
			}
			haptic('success');
		} catch {
			pushError = 'Push konnte nicht eingerichtet werden.';
		} finally {
			pushBusy = false;
		}
	}
</script>

<Sheet {open} {onclose} title="Profil">
	<form class="space-y-6" onsubmit={speichern}>
		<label class="mx-auto flex w-fit cursor-pointer flex-col items-center gap-2">
			<span class="relative inline-flex">
				{#if avatarSrc}
					<img
						src={avatarSrc}
						alt=""
						class="h-20 w-20 rounded-full object-cover shadow-[var(--shadow-soft-sm)] ring-4 ring-white/80 dark:ring-night-raised"
					/>
				{:else}
					<AvatarBadge name={name.trim() || '?'} size="lg" />
				{/if}
				<span
					class="absolute right-0 bottom-0 grid h-8 w-8 place-items-center rounded-full bg-ember text-white shadow-[var(--shadow-ember)]"
					aria-hidden="true"
				>
					<Camera class="h-3.5 w-3.5" strokeWidth={1.75} />
				</span>
			</span>
			<span class="micro-label micro-label-caps text-ink-soft dark:text-cream-soft">Foto ändern</span>
			<input type="file" accept="image/*" class="sr-only" onchange={onPick} disabled={busy} />
		</label>

		<div>
			<label
				for="settings-name"
				class="micro-label micro-label-caps mb-2 block text-ink-soft dark:text-cream-soft"
			>
				Name
			</label>
			<input
				id="settings-name"
				type="text"
				required
				maxlength="40"
				autocomplete="name"
				bind:value={name}
				class="input-soft"
			/>
		</div>

		<section aria-labelledby="notif-heading">
			<h3
				id="notif-heading"
				class="micro-label micro-label-caps mb-2 px-0.5 text-ink-soft dark:text-cream-soft"
			>
				Benachrichtigungen
			</h3>
			<ul class="group-list overflow-hidden">
				<li class="group-row flex min-h-14 items-center justify-between gap-3 px-4 py-2">
					<div class="min-w-0">
						<p class="text-[0.9375rem] font-medium">Antworten</p>
						<p class="text-[0.8rem] leading-snug text-ink-soft dark:text-cream-soft">
							Wenn jemand auf dich antwortet
						</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-label="Antworten"
						aria-checked={notifyReplies}
						class="ios-switch"
						class:ios-switch--on={notifyReplies}
						onclick={() => setPref('notifyReplies', !notifyReplies)}
					>
						<span class="ios-switch-knob"></span>
					</button>
				</li>
				<li class="group-row flex min-h-14 items-center justify-between gap-3 px-4 py-2">
					<div class="min-w-0">
						<p class="text-[0.9375rem] font-medium">Erwähnungen</p>
						<p class="text-[0.8rem] leading-snug text-ink-soft dark:text-cream-soft">
							Wenn dich jemand mit @ anspricht
						</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-label="Erwähnungen"
						aria-checked={notifyMentions}
						class="ios-switch"
						class:ios-switch--on={notifyMentions}
						onclick={() => setPref('notifyMentions', !notifyMentions)}
					>
						<span class="ios-switch-knob"></span>
					</button>
				</li>
				<li class="group-row flex min-h-14 items-center justify-between gap-3 px-4 py-2">
					<div class="min-w-0">
						<p class="text-[0.9375rem] font-medium">Einträge</p>
						<p class="text-[0.8rem] leading-snug text-ink-soft dark:text-cream-soft">
							Aktivität an Items, die du anlegst oder zusagst
						</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-label="Einträge"
						aria-checked={notifyItemActivity}
						class="ios-switch"
						class:ios-switch--on={notifyItemActivity}
						onclick={() => setPref('notifyItemActivity', !notifyItemActivity)}
					>
						<span class="ios-switch-knob"></span>
					</button>
				</li>
			</ul>
			<p class="mt-2 px-1 text-[0.75rem] leading-snug text-ink-soft dark:text-cream-soft">
				Pro Nachricht höchstens eine Benachrichtigung – Erwähnung vor Antwort vor Eintrag.
			</p>
		</section>

		{#if canPush}
			<section aria-labelledby="push-heading">
				<h3
					id="push-heading"
					class="micro-label micro-label-caps mb-2 px-0.5 text-ink-soft dark:text-cream-soft"
				>
					Push
				</h3>
				<ul class="group-list overflow-hidden">
					<li class="group-row flex min-h-14 items-center justify-between gap-3 px-4 py-2">
						<div class="min-w-0">
							<p class="text-[0.9375rem] font-medium">Auf dem Gerät</p>
							<p class="text-[0.8rem] leading-snug text-ink-soft dark:text-cream-soft">
								Auch wenn die App zu ist
							</p>
						</div>
						<button
							type="button"
							role="switch"
							aria-label="Push auf dem Gerät"
							aria-checked={pushOn}
							aria-busy={pushBusy}
							disabled={pushBusy}
							class="ios-switch"
							class:ios-switch--on={pushOn}
							onclick={togglePush}
						>
							<span class="ios-switch-knob"></span>
						</button>
					</li>
				</ul>
				{#if pushError}
					<p role="alert" class="mt-2 px-1 text-sm text-red-600 dark:text-red-400">{pushError}</p>
				{/if}
			</section>
		{/if}

		{#if error}
			<p role="alert" class="text-sm text-red-600 dark:text-red-400">{error}</p>
		{/if}

		<button type="submit" disabled={busy || !name.trim()} class="btn-primary w-full">
			{busy ? 'Speichern …' : 'Speichern'}
		</button>
	</form>
</Sheet>
