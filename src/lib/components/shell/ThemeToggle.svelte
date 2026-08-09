<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import { theme, toggleTheme } from '$lib/stores/theme';
</script>

<button
	onclick={toggleTheme}
	aria-label="Farbschema wechseln"
	class="pressable flex h-11 w-11 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-white/60 hover:text-ink dark:text-cream-soft dark:hover:bg-night-raised dark:hover:text-cream"
>
	{#if $theme === 'dark'}
		<Sun size={18} strokeWidth={1.6} />
	{:else}
		<Moon size={18} strokeWidth={1.6} />
	{/if}
</button>
