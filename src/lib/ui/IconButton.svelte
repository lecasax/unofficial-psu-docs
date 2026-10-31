<script lang="ts">
	import 'm3-svelte/etc/layer';
	import { Icon } from 'm3-svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import type { IconData } from './types.js';

	// MD3 icon button with a plain tooltip (its label) and an optional count badge.
	type Props = {
		icon: IconData;
		label: string;
		variant?: 'standard' | 'tonal' | 'filled';
		badge?: number;
		/** Where the tooltip opens; "end" keeps it inside the screen for buttons at the right edge. */
		tip?: 'below' | 'below-end' | 'above' | 'none';
		element?: HTMLElement;
	} & (({ href: string } & Omit<HTMLAnchorAttributes, 'href'>) | ({ href?: undefined } & HTMLButtonAttributes));

	let { icon, label, variant = 'standard', badge = 0, tip = 'below', element = $bindable(), ...rest }: Props = $props();
</script>

{#snippet content()}
	<Icon {icon} size={24} />
	{#if badge > 0}<span class="badge" aria-hidden="true">{badge}</span>{/if}
	{#if tip !== 'none'}<span class="tip {tip}" aria-hidden="true">{label}</span>{/if}
{/snippet}

{#if rest.href !== undefined}
	<a
		bind:this={element}
		class="icon-button m3-layer {variant}"
		aria-label={badge ? `${label} (${badge} active)` : label}
		{...rest as HTMLAnchorAttributes}
	>
		{@render content()}
	</a>
{:else}
	<button
		bind:this={element}
		type="button"
		class="icon-button m3-layer {variant}"
		aria-label={badge ? `${label} (${badge} active)` : label}
		{...rest as HTMLButtonAttributes}
	>
		{@render content()}
	</button>
{/if}

<style>
	.icon-button {
		display: inline-grid;
		place-items: center;
		flex: none;
		width: 40px;
		height: 40px;
		padding: 0;
		border: 0;
		border-radius: var(--m3-shape-full);
		background: transparent;
		color: var(--m3c-on-surface-variant);
		cursor: pointer;
		transition: border-radius var(--m3-easing-fast-spatial);

		&:active {
			border-radius: var(--m3-shape-medium);
		}
	}

	.tonal {
		background-color: var(--m3c-secondary-container);
		color: var(--m3c-on-secondary-container);
	}

	.filled {
		background-color: var(--m3c-primary);
		color: var(--m3c-on-primary);
	}

	.badge {
		@apply --m3-label-small;
		position: absolute;
		top: 2px;
		right: 0;
		display: grid;
		place-items: center;
		min-width: 16px;
		height: 16px;
		padding: 0 4px;
		box-sizing: border-box;
		border-radius: var(--m3-shape-full);
		background-color: var(--m3c-primary);
		color: var(--m3c-on-primary);
		font-variant-numeric: tabular-nums;
	}

	/* MD3 plain tooltip. */
	.tip {
		@apply --m3-body-small;
		position: absolute;
		left: 50%;
		z-index: 30;
		padding: 4px 8px;
		border-radius: var(--m3-shape-extra-small);
		background-color: var(--m3c-inverse-surface);
		color: var(--m3c-inverse-on-surface);
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		translate: -50% 0;
		transition: opacity 120ms linear;
	}

	.tip.below,
	.tip.below-end {
		top: calc(100% + 4px);
	}

	.tip.below-end {
		right: 0;
		left: auto;
		translate: 0 0;
	}

	.tip.above {
		bottom: calc(100% + 4px);
	}

	@media (hover: hover) {
		.icon-button:hover .tip {
			opacity: 1;
			transition-delay: 500ms;
		}
	}

	.icon-button:focus-visible .tip {
		opacity: 1;
	}
</style>
