<script lang="ts">
	import { Icon } from 'm3-svelte';
	import type { IconData } from './types.js';

	// An icon on an MD3 Expressive shape (paths from m3-svelte, 380×380 viewBox).
	let {
		icon,
		shape,
		size = 56,
		tone = 'secondary'
	}: { icon: IconData; shape: string; size?: number; tone?: 'primary' | 'secondary' | 'tertiary' | 'neutral' } = $props();
</script>

<span class="shape-icon {tone}" style:--size="{size}px" aria-hidden="true">
	<svg viewBox="0 0 380 380"><path d={shape} /></svg>
	<Icon {icon} size={Math.round(size * 0.46)} />
</span>

<style>
	.shape-icon {
		position: relative;
		display: inline-grid;
		flex: none;
		place-items: center;
		width: var(--size);
		height: var(--size);

		> svg {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
		}

		> :global(svg:last-child) {
			position: relative;
		}
	}

	.primary {
		color: var(--m3c-on-primary-container);
		fill: var(--m3c-primary-container);
	}

	.secondary {
		color: var(--m3c-on-secondary-container);
		fill: var(--m3c-secondary-container);
	}

	.tertiary {
		color: var(--m3c-on-tertiary-container);
		fill: var(--m3c-tertiary-container);
	}

	.neutral {
		color: var(--m3c-on-surface-variant);
		fill: var(--m3c-surface-container-highest);
	}

	path {
		fill: inherit;
	}
</style>
