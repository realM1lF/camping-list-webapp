<script lang="ts">
	import type { Snippet } from 'svelte';
	import { browser } from '$app/environment';
	import { haptic } from '$lib/motion/haptic';
	import {
		project,
		rubberband,
		stepSpring,
		velocityFromHistory,
		SPRING_SHEET,
		SPRING_SHEET_SETTLE,
		type SpringParams
	} from '$lib/motion/spring';

	interface Props {
		open: boolean;
		onclose: () => void;
		title?: string;
		children: Snippet;
	}

	let { open, onclose, title, children }: Props = $props();

	let panelEl = $state<HTMLDivElement | undefined>();
	let bodyEl = $state<HTMLDivElement | undefined>();
	let closeBtnEl = $state<HTMLButtonElement | undefined>();
	let y = $state(0);
	let dragging = $state(false);
	let animating = $state(false);
	let isDesktop = $state(false);
	let reduceMotion = $state(false);
	let mounted = $state(false);
	let exiting = $state(false);
	let scrimOpacity = $state(0);

	let velocity = 0;
	let history: Array<{ y: number; t: number }> = [];
	let startY = 0;
	let startDragY = 0;
	let pointerId: number | null = null;
	let raf = 0;
	let lastFrame = 0;
	let springTarget = 0;
	let springParams: SpringParams = SPRING_SHEET_SETTLE;
	let onSettle: (() => void) | null = null;
	let panelHeight = 480;
	let dragArmed = false; // content: waiting for hysteresis
	let previousFocus: HTMLElement | null = null;
	let exitTimer: ReturnType<typeof setTimeout> | null = null;

	const HYSTERESIS = 10;
	const DESKTOP_EXIT_MS = 280;
	const REDUCED_EXIT_MS = 180;

	$effect(() => {
		if (!browser) return;
		const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const mqDesktop = window.matchMedia('(min-width: 640px)');
		const sync = () => {
			reduceMotion = mqMotion.matches;
			isDesktop = mqDesktop.matches;
		};
		sync();
		mqMotion.addEventListener('change', sync);
		mqDesktop.addEventListener('change', sync);
		return () => {
			mqMotion.removeEventListener('change', sync);
			mqDesktop.removeEventListener('change', sync);
		};
	});

	$effect(() => {
		if (!browser) return;
		if (open) {
			const prev = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = prev;
			};
		}
	});

	function stopSpring() {
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
		animating = false;
		onSettle = null;
	}

	function measureHeight() {
		panelHeight = panelEl?.offsetHeight ?? Math.min(window.innerHeight * 0.9, 640);
		return panelHeight;
	}

	function updateScrim() {
		if (isDesktop) {
			scrimOpacity = mounted ? 1 : 0;
			return;
		}
		const h = Math.max(panelHeight, 1);
		scrimOpacity = Math.max(0.12, Math.min(1, 1 - y / (h * 1.05)));
	}

	function tick(now: number) {
		const dt = lastFrame ? (now - lastFrame) / 1000 : 1 / 60;
		lastFrame = now;
		const state = { value: y, velocity };
		const done = stepSpring(state, springTarget, dt, springParams);
		y = state.value;
		velocity = state.velocity;
		updateScrim();

		if (done) {
			raf = 0;
			animating = false;
			const finish = onSettle;
			onSettle = null;
			finish?.();
			return;
		}
		raf = requestAnimationFrame(tick);
	}

	function animateTo(target: number, params: SpringParams, initialVelocity: number, done?: () => void) {
		stopSpring();
		if (reduceMotion || isDesktop) {
			y = target;
			velocity = 0;
			updateScrim();
			done?.();
			return;
		}
		springTarget = target;
		springParams = params;
		velocity = initialVelocity;
		onSettle = done ?? null;
		animating = true;
		lastFrame = 0;
		raf = requestAnimationFrame(tick);
	}

	function clearExitTimer() {
		if (exitTimer) {
			clearTimeout(exitTimer);
			exitTimer = null;
		}
	}

	function finishClose() {
		clearExitTimer();
		restoreFocus();
		mounted = false;
		exiting = false;
		y = 0;
		velocity = 0;
		scrimOpacity = 0;
		onclose();
	}

	function dismiss(releaseVelocity = 0) {
		if (!mounted || exiting) return;
		exiting = true;
		haptic('light');
		if (isDesktop || reduceMotion) {
			scrimOpacity = 0;
			clearExitTimer();
			exitTimer = setTimeout(finishClose, reduceMotion ? REDUCED_EXIT_MS : DESKTOP_EXIT_MS);
			return;
		}
		measureHeight();
		const flick = Math.max(releaseVelocity, 600);
		animateTo(panelHeight + 48, SPRING_SHEET, flick, finishClose);
	}

	function restoreFocus() {
		const el = previousFocus;
		previousFocus = null;
		if (el && typeof el.focus === 'function') {
			requestAnimationFrame(() => el.focus({ preventScroll: true }));
		}
	}

	function beginDrag(e: PointerEvent, captureTarget: HTMLElement) {
		// Interrupt mid-flight from live presentation value — keep spring velocity in history seed
		const inherited = velocity;
		stopSpring();
		captureTarget.setPointerCapture(e.pointerId);
		pointerId = e.pointerId;
		dragging = true;
		dragArmed = false;
		startY = e.clientY;
		startDragY = y;
		history = [{ y: e.clientY, t: e.timeStamp }];
		if (inherited !== 0) {
			// Seed so a re-grab mid-flight doesn't hard-cut velocity at release
			history.unshift({ y: e.clientY - inherited * 0.016, t: e.timeStamp - 16 });
		}
	}

	function onHandlePointerDown(e: PointerEvent) {
		if (isDesktop || e.button !== 0 || !mounted) return;
		beginDrag(e, e.currentTarget as HTMLElement);
	}

	function nestedScroller(el: EventTarget | null): HTMLElement | null {
		let n = el instanceof HTMLElement ? el : null;
		while (n && n !== bodyEl) {
			const oy = getComputedStyle(n).overflowY;
			if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && n.scrollHeight > n.clientHeight) {
				return n;
			}
			n = n.parentElement;
		}
		return null;
	}

	function onBodyPointerDown(e: PointerEvent) {
		if (isDesktop || e.button !== 0 || !mounted || dragging) return;
		const t = e.target as HTMLElement | null;
		if (t?.closest('button, input, textarea, select, a, [role="listbox"]')) return;
		if ((bodyEl?.scrollTop ?? 0) > 0) return;
		const inner = nestedScroller(e.target);
		if (inner && inner.scrollTop > 0) return;
		dragArmed = true;
		pointerId = e.pointerId;
		startY = e.clientY;
		startDragY = y;
		history = [{ y: e.clientY, t: e.timeStamp }];
	}

	function onPointerMove(e: PointerEvent) {
		if (e.pointerId !== pointerId) return;

		if (dragArmed && !dragging) {
			const dy = e.clientY - startY;
			// Parallel gesture disambiguation: commit once intent is clear
			const inner = nestedScroller(e.target);
			if (dy > HYSTERESIS && (bodyEl?.scrollTop ?? 0) <= 0 && (!inner || inner.scrollTop <= 0)) {
				beginDrag(e, bodyEl ?? (e.currentTarget as HTMLElement));
			} else if (dy < -HYSTERESIS) {
				dragArmed = false;
				pointerId = null;
				return;
			} else {
				return;
			}
		}

		if (!dragging) return;
		e.preventDefault();
		const raw = startDragY + (e.clientY - startY);
		if (raw < 0) {
			y = -rubberband(-raw, 120);
		} else {
			y = raw;
		}
		history.push({ y: e.clientY, t: e.timeStamp });
		if (history.length > 8) history.shift();
		updateScrim();
	}

	function onPointerUp(e: PointerEvent) {
		if (e.pointerId !== pointerId) return;

		if (dragArmed && !dragging) {
			dragArmed = false;
			pointerId = null;
			return;
		}

		if (!dragging) return;
		dragging = false;
		pointerId = null;
		const v = velocityFromHistory(history);
		velocity = v;
		const projected = y + project(Math.max(0, v));
		if (y > 110 || projected > 180 || v > 900) {
			dismiss(Math.max(v, 400));
		} else {
			if (y > 20) haptic('light');
			const bounce = Math.abs(v) > 400 ? SPRING_SHEET : SPRING_SHEET_SETTLE;
			animateTo(0, bounce, v);
		}
	}

	$effect(() => {
		if (!browser) return;
		if (!open) {
			if (exiting) return;
			if (mounted) {
				dismiss(700);
				return;
			}
			clearExitTimer();
			stopSpring();
			exiting = false;
			y = 0;
			velocity = 0;
			scrimOpacity = 0;
			dragging = false;
			dragArmed = false;
			return () => stopSpring();
		}

		clearExitTimer();
		exiting = false;
		previousFocus = (document.activeElement as HTMLElement) ?? null;
		mounted = true;
		const desktop = window.matchMedia('(min-width: 640px)').matches;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		const focusId = requestAnimationFrame(() => {
			closeBtnEl?.focus({ preventScroll: true });
		});

		if (desktop || reduced) {
			y = 0;
			velocity = 0;
			scrimOpacity = 1;
			return () => {
				cancelAnimationFrame(focusId);
				stopSpring();
			};
		}

		y = window.innerHeight * 0.85;
		velocity = 0;
		scrimOpacity = 0.35;
		const id = requestAnimationFrame(() => {
			measureHeight();
			y = panelHeight + 24;
			updateScrim();
			animateTo(0, SPRING_SHEET_SETTLE, 0);
		});
		return () => {
			cancelAnimationFrame(focusId);
			cancelAnimationFrame(id);
			stopSpring();
		};
	});

	function onKeydown(e: KeyboardEvent) {
		if (!open || !mounted) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			dismiss(900);
			return;
		}
		// Simple focus trap
		if (e.key !== 'Tab' || !panelEl) return;
		const focusables = panelEl.querySelectorAll<HTMLElement>(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		if (focusables.length === 0) return;
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	let panelTransform = $derived(isDesktop ? undefined : `translate3d(0, ${y}px, 0)`);
	let sheetBlur = $derived(isDesktop ? 40 : Math.max(14, 40 - Math.max(0, y) * 0.04));
</script>

<svelte:window onkeydown={onKeydown} />

{#if mounted}
	<div
		class="fixed inset-0 z-50"
		class:pointer-events-none={exiting}
		role="dialog"
		aria-modal="true"
		aria-label={title ?? 'Dialog'}
	>
		<button
			class="sheet-scrim absolute inset-0 h-full w-full cursor-default"
			class:sheet-scrim--desktop={isDesktop}
			class:sheet-scrim--reduced={reduceMotion}
			onclick={() => dismiss(700)}
			aria-label="Schließen"
			tabindex="-1"
			style="opacity: {scrimOpacity}"
		></button>

		<div
			bind:this={panelEl}
			class="sheet-panel material-sheet absolute inset-x-0 bottom-0 mx-auto flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-[1.75rem] sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:max-h-[min(90dvh,40rem)] sm:w-[min(100%-2rem,28rem)] sm:-translate-y-1/2 sm:rounded-[1.75rem]"
			class:sheet-panel--dragging={dragging}
			class:sheet-panel--desktop={isDesktop && !exiting && !reduceMotion}
			class:sheet-panel--desktop-out={isDesktop && exiting && !reduceMotion}
			class:sheet-panel--reduced={reduceMotion && !exiting}
			class:sheet-panel--reduced-out={reduceMotion && exiting}
			style="{panelTransform
				? `transform: ${panelTransform};`
				: ''} --sheet-blur: {sheetBlur}px;"
		>
			{#if !title}
				<button
					bind:this={closeBtnEl}
					type="button"
					class="sr-only"
					onclick={() => dismiss(700)}
				>
					Schließen
				</button>
			{/if}
			<div
				role="separator"
				aria-orientation="horizontal"
				aria-label="Sheet ziehen zum Schließen"
				class="sheet-handle shrink-0 touch-none px-4 pt-3 pb-1 sm:cursor-default sm:pt-4"
				onpointerdown={onHandlePointerDown}
				onpointermove={onPointerMove}
				onpointerup={onPointerUp}
				onpointercancel={onPointerUp}
			>
				<div
					class="mx-auto h-1 w-10 rounded-full bg-ink/15 dark:bg-cream/20 sm:hidden"
					aria-hidden="true"
				></div>
				{#if title}
					<div class="mt-3 flex items-center justify-between gap-4 px-1 sm:mt-0">
						<h2 class="text-xl font-semibold tracking-tight">{title}</h2>
						<button
							bind:this={closeBtnEl}
							type="button"
							class="pressable micro-label shrink-0 rounded-full bg-sunken/70 px-3 py-1.5 text-ink-soft hover:text-ink dark:bg-night-sunken dark:text-cream-soft dark:hover:text-cream"
							onclick={() => dismiss(700)}
						>
							Schließen
						</button>
					</div>
				{/if}
			</div>

			<div
				bind:this={bodyEl}
				role="document"
				class="sheet-body min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
				class:sheet-body--dragging={dragging}
				onpointerdown={onBodyPointerDown}
				onpointermove={onPointerMove}
				onpointerup={onPointerUp}
				onpointercancel={onPointerUp}
			>
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	.sheet-scrim {
		background: rgb(26 34 28 / 0.38);
		backdrop-filter: blur(6px) saturate(140%);
		-webkit-backdrop-filter: blur(6px) saturate(140%);
		border: 0;
		transition: none;
	}

	.sheet-scrim--desktop:not(.sheet-scrim--reduced) {
		transition: opacity 280ms var(--ease-spring, cubic-bezier(0.32, 0.72, 0, 1));
	}

	.sheet-scrim--reduced {
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		background: rgb(26 34 28 / 0.55);
		transition: opacity 180ms ease;
	}

	.sheet-panel {
		backdrop-filter: blur(var(--sheet-blur, 40px)) saturate(190%);
		-webkit-backdrop-filter: blur(var(--sheet-blur, 40px)) saturate(190%);
		will-change: transform;
		transition: none;
	}

	.sheet-body--dragging {
		overflow: hidden;
		touch-action: none;
	}

	.sheet-panel--desktop {
		animation: sheet-desktop-in 320ms var(--ease-spring, cubic-bezier(0.32, 0.72, 0, 1));
	}

	.sheet-panel--desktop-out {
		animation: sheet-desktop-out 280ms var(--ease-spring, cubic-bezier(0.32, 0.72, 0, 1)) both;
		pointer-events: none;
	}

	.sheet-panel--reduced {
		animation: sheet-fade 180ms ease;
	}

	.sheet-panel--reduced-out {
		animation: sheet-fade-out 180ms ease both;
		pointer-events: none;
	}

	@keyframes sheet-desktop-in {
		from {
			opacity: 0;
			transform: translate3d(0, calc(-50% + 14px), 0) scale(0.97);
			filter: blur(6px);
		}
		to {
			opacity: 1;
			transform: translate3d(0, -50%, 0) scale(1);
			filter: blur(0);
		}
	}

	@keyframes sheet-desktop-out {
		from {
			opacity: 1;
			transform: translate3d(0, -50%, 0) scale(1);
			filter: blur(0);
		}
		to {
			opacity: 0;
			transform: translate3d(0, calc(-50% + 14px), 0) scale(0.97);
			filter: blur(6px);
		}
	}

	@keyframes sheet-fade {
		from {
			opacity: 0;
		}
	}

	@keyframes sheet-fade-out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	@media (prefers-reduced-transparency: reduce) {
		.sheet-scrim {
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
			background: rgb(26 34 28 / 0.55);
		}
	}
</style>
