<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import BrandMark from '$lib/components/BrandMark.svelte';
	import { sendMagicCode, signInWithMagicCode } from '$lib/db/repo';

	let email = $state('');
	let code = $state('');
	let step = $state<'email' | 'code'>('email');
	let busy = $state(false);
	let error = $state<string | null>(null);

	function fehlerText(e: unknown): string {
		const msg = e instanceof Error ? e.message : String(e);
		if (/invalid|expired|code/i.test(msg)) return 'Der Code war leider falsch oder abgelaufen.';
		if (/email/i.test(msg)) return 'Das sieht nicht nach einer gültigen E-Mail-Adresse aus.';
		return 'Das hat nicht geklappt. Bitte versuch es noch einmal.';
	}

	async function codeSenden(e: SubmitEvent) {
		e.preventDefault();
		if (busy || !email.trim()) return;
		busy = true;
		error = null;
		try {
			await sendMagicCode(email.trim());
			step = 'code';
		} catch (err) {
			error = fehlerText(err);
		} finally {
			busy = false;
		}
	}

	async function anmelden(e: SubmitEvent) {
		e.preventDefault();
		if (busy || code.trim().length === 0) return;
		busy = true;
		error = null;
		try {
			await signInWithMagicCode(email.trim(), code.trim());
		} catch (err) {
			error = fehlerText(err);
		} finally {
			busy = false;
		}
	}
</script>

<main
	class="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10"
>
	<div
		class="pointer-events-none absolute inset-0 -z-10"
		aria-hidden="true"
		style="background: radial-gradient(ellipse 75% 50% at 50% 12%, rgb(212 232 218 / 0.5), transparent 65%);"
	></div>

	<div class="w-full max-w-sm text-center">
		<BrandMark size="hero" class="mx-auto mb-8 shadow-[var(--shadow-soft)]" />
		<p class="micro-label micro-label-caps mb-3 text-ink-soft dark:text-cream-soft">
			Geteilte Packliste
		</p>
		<h1 class="font-brand text-[2.85rem] tracking-tight text-ink dark:text-cream">Camping</h1>
		<p class="mx-auto mt-4 max-w-[18rem] text-pretty text-[0.95rem] leading-relaxed text-ink-soft dark:text-cream-soft">
			Wer braucht was — und wer bringt’s mit.
		</p>

		{#if step === 'email'}
			<form class="mt-10 flex flex-col gap-3" onsubmit={codeSenden}>
				<label class="sr-only" for="login-email">E-Mail-Adresse</label>
				<input
					id="login-email"
					type="email"
					required
					autocomplete="email"
					placeholder="deine@email.de"
					bind:value={email}
					class="input-soft text-center"
				/>
				<button type="submit" disabled={busy} class="btn-primary w-full gap-2">
					{busy ? 'Wird gesendet …' : 'Code senden'}
					{#if !busy}<ArrowRight size={18} strokeWidth={1.75} />{/if}
				</button>
			</form>
			<p class="mt-5 text-[0.8125rem] leading-relaxed text-ink-soft dark:text-cream-soft">
				Wir schicken dir einen Code per E-Mail – kein Passwort nötig.
			</p>
		{:else}
			<form class="mt-10 flex flex-col gap-3" onsubmit={anmelden}>
				<p class="text-sm text-ink-soft dark:text-cream-soft">
					Code ist unterwegs an
					<span class="font-medium text-ink dark:text-cream">{email}</span>
				</p>
				<label class="sr-only" for="login-code">6-stelliger Code</label>
				<input
					id="login-code"
					type="text"
					inputmode="numeric"
					pattern="[0-9]*"
					maxlength="6"
					required
					autocomplete="one-time-code"
					placeholder="123456"
					bind:value={code}
					class="input-soft text-center font-display text-2xl tracking-[0.35em]"
				/>
				<button type="submit" disabled={busy} class="btn-primary w-full">
					{busy ? 'Prüfe Code …' : 'Anmelden'}
				</button>
				<button
					type="button"
					onclick={() => {
						step = 'email';
						code = '';
						error = null;
					}}
					class="pressable micro-label min-h-11 text-ink-soft hover:text-ink dark:text-cream-soft dark:hover:text-cream"
				>
					Andere E-Mail nutzen
				</button>
			</form>
		{/if}

		{#if error}
			<p role="alert" class="mt-4 text-sm text-ember-deep dark:text-ember">{error}</p>
		{/if}
	</div>
</main>
