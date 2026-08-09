<script lang="ts">
	interface Props {
		name: string;
		src?: string | null;
		size?: 'sm' | 'md' | 'lg';
	}

	let { name, src = null, size = 'sm' }: Props = $props();

	const PALETTE = [
		'bg-[#3a7d55] text-[#eef7f0]',
		'bg-[#e07040] text-[#fff4ee]',
		'bg-[#5b8fa3] text-[#eef5f8]',
		'bg-[#c4a574] text-[#1a221c]',
		'bg-[#4f8f63] text-[#eef7f0]',
		'bg-[#2d6343] text-[#e8f2ee]'
	];

	const SIZE = {
		sm: 'h-6 w-6 text-[0.625rem]',
		md: 'h-8 w-8 text-xs',
		lg: 'h-16 w-16 text-lg'
	} as const;

	let hue = $derived(
		PALETTE[[...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % PALETTE.length]
	);
	let initials = $derived(
		name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase() ?? '')
			.join('')
	);
	let broken = $state(false);

	$effect(() => {
		src;
		broken = false;
	});
</script>

{#if src && !broken}
	<img
		{src}
		alt=""
		title={name}
		class="inline-block shrink-0 rounded-full object-cover shadow-[inset_0_0_0_0.5px_rgb(21_32_24_/_0.12)] select-none {SIZE[size]}"
		onerror={() => (broken = true)}
	/>
{:else}
	<span
		class="inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight shadow-[inset_0_0_0_0.5px_rgb(255_255_255_/_0.18)] select-none {hue} {SIZE[
			size
		]}"
		title={name}
	>
		{initials}
	</span>
{/if}
