<script lang="ts">
	import { Camera } from 'lucide-svelte';
	import { auth } from '$lib/db/store';
	import { ensureProfile } from '$lib/db/repo';
	import AvatarBadge from '$lib/components/AvatarBadge.svelte';
	import BrandMark from '$lib/components/BrandMark.svelte';

	let name = $state('');
	let preview = $state<string | null>(null);
	let avatarFile = $state<File | null>(null);
	let busy = $state(false);
	let error = $state<string | null>(null);

	function onPick(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		if (preview) URL.revokeObjectURL(preview);
		avatarFile = file;
		preview = URL.createObjectURL(file);
	}

	async function los(e: SubmitEvent) {
		e.preventDefault();
		const uid = $auth.user?.id;
		if (busy || !uid || !name.trim()) return;
		busy = true;
		error = null;
		try {
			await ensureProfile(uid, name.trim(), avatarFile);
		} catch {
			error = 'Das hat nicht geklappt. Bitte versuch es noch einmal.';
		} finally {
			busy = false;
		}
	}
</script>

<main
	class="flex min-h-dvh flex-col items-center justify-center px-6 pb-[env(safe-area-inset-bottom)] text-center"
>
	<div class="w-full max-w-sm">
		<BrandMark size="lg" class="mx-auto mb-6" />
		<h1 class="font-display text-3xl font-semibold tracking-tight">Wie heißt du?</h1>
		<p class="mt-3 text-[0.95rem] text-ink-soft dark:text-cream-soft">
			So sehen dich die anderen in der Liste.
		</p>

		<form class="mt-8 flex flex-col gap-4" onsubmit={los}>
			<label class="mx-auto cursor-pointer">
				<span class="sr-only">Profilbild wählen</span>
				<span class="relative inline-flex">
					{#if preview}
						<img
							src={preview}
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
				<input type="file" accept="image/*" class="sr-only" onchange={onPick} />
			</label>
			<p class="micro-label text-ink-soft dark:text-cream-soft">Optional: Profilbild</p>

			<label class="sr-only" for="profile-name">Dein Name</label>
			<input
				id="profile-name"
				type="text"
				required
				maxlength="40"
				autocomplete="name"
				placeholder="Z. B. Alex"
				bind:value={name}
				class="input-soft text-center"
			/>
			<button type="submit" disabled={busy || !name.trim()} class="btn-primary w-full">
				{busy ? 'Einen Moment …' : "Los geht's"}
			</button>
		</form>

		{#if error}
			<p role="alert" class="mt-4 text-sm text-ember-deep dark:text-ember">{error}</p>
		{/if}
	</div>
</main>
