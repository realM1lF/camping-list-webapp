<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg' | 'hero';
		class?: string;
	}

	let { size = 'md', class: className = '' }: Props = $props();

	const BOX = {
		sm: 'h-8 w-8 rounded-[0.7rem]',
		md: 'h-9 w-9 rounded-[0.8rem]',
		lg: 'h-16 w-16 rounded-[1.25rem]',
		hero: 'h-28 w-28 rounded-[2rem]'
	} as const;

	const PAD = {
		sm: 'p-1.5',
		md: 'p-[0.45rem]',
		lg: 'p-3',
		hero: 'p-5'
	} as const;
</script>

<span
	class="brand-mark inline-grid place-items-center {BOX[size]} {PAD[size]} {className}"
	aria-hidden="true"
>
	<svg viewBox="0 0 64 64" class="h-full w-full" fill="none">
		<path
			d="M32 10 L54 50 H10 Z"
			class="stroke-fern dark:stroke-fern"
			stroke-width="3.2"
			stroke-linejoin="round"
		/>
		<path d="M32 28 L42 50 H22 Z" class="fill-fern" />
		<circle
			cx="50"
			cy="16"
			r="5.5"
			class="stroke-sand dark:stroke-cream"
			stroke-width="2.4"
		/>
	</svg>
</span>

<style>
	.brand-mark {
		background: linear-gradient(
			145deg,
			color-mix(in oklab, var(--color-fern-soft) 90%, white),
			color-mix(in oklab, var(--color-ember-soft) 70%, white) 55%,
			color-mix(in oklab, var(--color-river-soft) 80%, white)
		);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.65),
			0 8px 24px rgb(26 34 28 / 0.1);
	}

	:global(.dark) .brand-mark {
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.08),
			0 10px 28px rgb(0 0 0 / 0.35);
	}
</style>
