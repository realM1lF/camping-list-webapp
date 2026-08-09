<script lang="ts">
	import { Camera } from 'lucide-svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import AvatarBadge from '$lib/components/AvatarBadge.svelte';
	import { auth, myProfile } from '$lib/db/store';
	import { setProfileAvatar, updateProfileName } from '$lib/db/repo';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open, onclose }: Props = $props();

	let name = $state('');
	let busy = $state(false);
	let error = $state<string | null>(null);
	let localPreview = $state<string | null>(null);

	$effect(() => {
		if (open && $myProfile) {
			name = $myProfile.name;
			error = null;
			busy = false;
			if (localPreview) {
				URL.revokeObjectURL(localPreview);
				localPreview = null;
			}
		}
	});

	let avatarSrc = $derived(localPreview ?? $myProfile?.avatar?.url ?? null);

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
</script>

<Sheet {open} {onclose} title="Profil">
	<form class="space-y-5" onsubmit={speichern}>
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

		{#if error}
			<p role="alert" class="text-sm text-red-600 dark:text-red-400">{error}</p>
		{/if}

		<button type="submit" disabled={busy || !name.trim()} class="btn-primary w-full">
			{busy ? 'Speichern …' : 'Speichern'}
		</button>
	</form>
</Sheet>
