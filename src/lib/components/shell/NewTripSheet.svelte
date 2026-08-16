<script lang="ts">
	import { goto } from '$app/navigation';
	import Sheet from '$lib/components/Sheet.svelte';
	import { myProfile } from '$lib/db/store';
	import { requireDb, id } from '$lib/db/client';
	import { updateTrip } from '$lib/db/repo';
	import type { Trip } from '$lib/types';

	interface Props {
		open: boolean;
		onclose: () => void;
		trip?: Trip | null;
	}

	let { open, onclose, trip = null }: Props = $props();

	const jahr = new Date().getFullYear();

	let name = $state(`Roßmühle ${jahr}`);
	let year = $state(jahr);
	let location = $state('Roßmühle, Grefenfeld an der Saale');
	let startDate = $state('');
	let endDate = $state('');
	let busy = $state(false);
	let error = $state<string | null>(null);

	let editing = $derived(Boolean(trip));

	// Felder zurücksetzen, wenn das Sheet frisch geöffnet wird.
	let warOffen = false;
	$effect(() => {
		if (open && !warOffen) {
			if (trip) {
				name = trip.name;
				year = trip.year;
				location = trip.location ?? '';
				startDate = trip.startDate ?? '';
				endDate = trip.endDate ?? '';
			} else {
				name = `Roßmühle ${jahr}`;
				year = jahr;
				location = 'Roßmühle, Grefenfeld an der Saale';
				startDate = '';
				endDate = '';
			}
			error = null;
		}
		warOffen = open;
	});

	async function speichern(e: SubmitEvent) {
		e.preventDefault();
		const profileId = $myProfile?.id;
		if (busy || !profileId || !name.trim()) return;
		busy = true;
		error = null;
		try {
			const payload = {
				name: name.trim(),
				year,
				location: location.trim() || undefined,
				startDate: startDate || undefined,
				endDate: endDate || undefined
			};
			if (trip) {
				await updateTrip(trip.id, payload);
				onclose();
			} else {
				const tid = id();
				const db = requireDb();
				await db.transact(
					db.tx.trips[tid]
						.update({ ...payload, createdAt: Date.now() })
						.link({ createdBy: profileId })
				);
				onclose();
				await goto(`/trip/${tid}`);
			}
		} catch {
			error = 'Der Trip konnte nicht gespeichert werden. Bitte versuch es noch einmal.';
		} finally {
			busy = false;
		}
	}
</script>

<Sheet {open} {onclose} title={editing ? 'Trip bearbeiten' : 'Neuer Trip'}>
	<form class="flex flex-col gap-4" onsubmit={speichern}>
		<div class="flex flex-col gap-1.5">
			<label class="micro-label micro-label-caps text-ink-soft dark:text-cream-soft" for="trip-name"
				>Name</label
			>
			<input id="trip-name" type="text" required maxlength="60" bind:value={name} class="input-soft" />
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div class="flex flex-col gap-1.5">
				<label class="micro-label micro-label-caps text-ink-soft dark:text-cream-soft" for="trip-year"
					>Jahr</label
				>
				<input
					id="trip-year"
					type="number"
					required
					min="2020"
					max="2100"
					bind:value={year}
					class="input-soft"
				/>
			</div>
			<div class="flex flex-col gap-1.5">
				<label
					class="micro-label micro-label-caps text-ink-soft dark:text-cream-soft"
					for="trip-location">Ort</label
				>
				<input id="trip-location" type="text" maxlength="80" bind:value={location} class="input-soft" />
			</div>
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div class="flex flex-col gap-1.5">
				<label class="micro-label micro-label-caps text-ink-soft dark:text-cream-soft" for="trip-start"
					>Von</label
				>
				<input id="trip-start" type="date" bind:value={startDate} class="input-soft" />
			</div>
			<div class="flex flex-col gap-1.5">
				<label class="micro-label micro-label-caps text-ink-soft dark:text-cream-soft" for="trip-end"
					>Bis</label
				>
				<input
					id="trip-end"
					type="date"
					min={startDate || undefined}
					bind:value={endDate}
					class="input-soft"
				/>
			</div>
		</div>

		{#if error}
			<p role="alert" class="text-sm text-ember-deep dark:text-ember">{error}</p>
		{/if}

		<button type="submit" disabled={busy || !name.trim()} class="btn-primary w-full">
			{busy ? 'Wird gespeichert …' : editing ? 'Speichern' : 'Trip anlegen'}
		</button>
	</form>
</Sheet>
