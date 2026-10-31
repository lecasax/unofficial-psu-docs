<script lang="ts" generics="T extends string">
	import 'm3-svelte/etc/layer';
	import { Icon } from 'm3-svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import iconArrow from '@ktibow/iconset-material-symbols/arrow-drop-down-rounded';
	import iconCheck from '@ktibow/iconset-material-symbols/check-rounded';
	import { follow, placePopover } from './popover-place.js';
	import type { IconData, MenuOption } from './types.js';

	// A button that opens a short MD3 menu of options, one of them selected (a select, without
	// the native box). The menu is a popover: top layer, light dismiss, Esc to close. Long
	// lists use SearchMenu instead, which adds a search field.
	let {
		value = $bindable(),
		options,
		label,
		variant = 'field',
		icon,
		align = 'start',
		active = false,
		onchange,
		...rest
	}: {
		value: T;
		options: MenuOption<T>[];
		/** Accessible name of the button and the menu. */
		label: string;
		/** field: full-width outlined box; chip: MD3 filter chip; icon: icon button. */
		variant?: 'field' | 'chip' | 'icon';
		icon?: IconData;
		align?: 'start' | 'end';
		/** Chip only: show it as selected (a non-default choice). */
		active?: boolean;
		onchange?: (value: T) => void;
	} & Omit<HTMLButtonAttributes, 'value' | 'onchange'> = $props();

	const id = $props.id();
	let trigger = $state<HTMLButtonElement>();
	let menu = $state<HTMLDivElement>();
	let open = $state(false);
	let stopFollowing: (() => void) | undefined;
	const current = $derived(options.find((o) => o.value === value));
	const showCounts = $derived(options.some((o) => o.count !== undefined));

	const menuItems = () => [...(menu?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
	const place = () => placePopover(trigger!, menu!, { align, wanted: options.length * 48 + 8 });

	function ontoggle(e: ToggleEvent) {
		open = e.newState === 'open';
		stopFollowing?.();
		stopFollowing = undefined;
		if (open) {
			const list = menuItems();
			(list.find((el) => el.getAttribute('aria-checked') === 'true') ?? list[0])?.focus();
			if (trigger && menu) stopFollowing = follow(trigger, menu, place);
		} else {
			const focused = document.activeElement;
			if (!focused || focused === document.body || menu?.contains(focused)) trigger?.focus();
		}
	}

	function choose(v: T) {
		value = v;
		onchange?.(v);
		menu?.hidePopover();
		trigger?.focus();
	}

	function menuKey(e: KeyboardEvent) {
		const list = menuItems();
		const i = list.indexOf(document.activeElement as HTMLElement);
		const go = (n: number) => {
			e.preventDefault();
			list[(n + list.length) % list.length]?.focus();
		};
		if (e.key === 'ArrowDown') go(i + 1);
		else if (e.key === 'ArrowUp') go(i - 1);
		else if (e.key === 'Home') go(0);
		else if (e.key === 'End') go(list.length - 1);
		else if (e.key === 'Tab') {
			e.preventDefault();
			menu?.hidePopover();
			trigger?.focus();
		}
	}

	function triggerKey(e: KeyboardEvent) {
		if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !open) {
			e.preventDefault();
			menu?.showPopover();
		}
	}
</script>

<button
	bind:this={trigger}
	type="button"
	class="trigger {variant} m3-layer"
	class:active
	class:open
	popovertarget="{id}-menu"
	aria-haspopup="menu"
	aria-expanded={open}
	aria-controls="{id}-menu"
	aria-label={variant === 'icon' ? label : `${label}: ${current?.label ?? ''}`}
	onkeydown={triggerKey}
	{...rest}
>
	{#if variant === 'icon'}
		<Icon icon={current?.icon ?? icon ?? iconArrow} size={24} />
		<span class="tip" class:end={align === 'end'} aria-hidden="true">{label}</span>
	{:else}
		{#if icon}<Icon {icon} size={18} />{/if}
		<span class="value">{current?.label}</span>
		<Icon icon={iconArrow} size={variant === 'chip' ? 18 : 24} class="arrow" />
	{/if}
</button>

<div
	bind:this={menu}
	id="{id}-menu"
	class="menu"
	popover="auto"
	role="menu"
	tabindex="-1"
	aria-label={label}
	onbeforetoggle={(e) => e.newState === 'open' && place()}
	{ontoggle}
	onkeydown={menuKey}
>
	{#each options as o (o.value)}
		{@const selected = o.value === value}
		<button
			type="button"
			class="item m3-layer"
			class:selected
			role="menuitemradio"
			aria-checked={selected}
			tabindex="-1"
			onclick={() => choose(o.value)}
		>
			<span class="lead">
				{#if o.icon}<Icon icon={o.icon} size={20} />{:else if selected}<Icon icon={iconCheck} size={20} />{/if}
			</span>
			<span class="label">{o.label}</span>
			{#if showCounts}<span class="count">{o.count ?? ''}</span>{/if}
			{#if o.icon && selected}<Icon icon={iconCheck} size={20} />{/if}
		</button>
	{/each}
</div>

<style>
	.trigger {
		display: inline-flex;
		align-items: center;
		border: 0;
		background: transparent;
		color: var(--m3c-on-surface);
		cursor: pointer;
		white-space: nowrap;
	}

	.value {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.trigger :global(.arrow) {
		margin-left: auto;
		color: var(--m3c-on-surface-variant);
		transition: rotate var(--m3-easing-fast);
	}

	.trigger.open :global(.arrow) {
		rotate: 180deg;
	}

	/* Full-width box, for side panels. */
	.field {
		@apply --m3-body-large;
		width: 100%;
		height: 48px;
		gap: 8px;
		padding: 0 8px 0 16px;
		border-radius: var(--m3-shape-medium);
		outline: 1px solid var(--m3c-outline);
		outline-offset: -1px;

		&:hover {
			outline-color: var(--m3c-on-surface);
		}

		&.open {
			outline: 2px solid var(--m3c-primary);
			outline-offset: -2px;
		}
	}

	/* MD3 filter chip with a dropdown arrow. */
	.chip {
		@apply --m3-label-large;
		height: 32px;
		gap: 8px;
		padding: 0 8px;
		border-radius: var(--m3-shape-small);
		outline: 1px solid var(--m3c-outline);
		outline-offset: -1px;
		color: var(--m3c-on-surface-variant);

		&.active {
			outline-color: transparent;
			background-color: var(--m3c-secondary-container);
			color: var(--m3c-on-secondary-container);
		}

		& > :global(svg:first-child) {
			color: var(--m3c-primary);
		}
	}

	.icon {
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--m3-shape-full);
		color: var(--m3c-on-surface-variant);
	}

	/* MD3 plain tooltip, as in IconButton. */
	.tip {
		@apply --m3-body-small;
		position: absolute;
		top: calc(100% + 4px);
		left: 50%;
		z-index: 30;
		padding: 4px 8px;
		border-radius: var(--m3-shape-extra-small);
		background-color: var(--m3c-inverse-surface);
		color: var(--m3c-inverse-on-surface);
		pointer-events: none;
		opacity: 0;
		translate: -50% 0;
		transition: opacity 120ms linear;
	}

	.tip.end {
		right: 0;
		left: auto;
		translate: 0 0;
	}

	@media (hover: hover) {
		.icon:hover:not(.open) .tip {
			opacity: 1;
			transition-delay: 500ms;
		}
	}

	.icon:focus-visible:not(.open) .tip {
		opacity: 1;
	}

	.menu {
		position: fixed;
		inset: auto;
		box-sizing: border-box;
		margin: 0;
		padding: 4px;
		overflow-y: auto;
		overscroll-behavior: contain;
		border: 0;
		border-radius: var(--m3-shape-large);
		background-color: var(--app-raised);
		color: var(--m3c-on-surface);
		box-shadow: var(--m3-elevation-2);
	}

	.menu:popover-open {
		display: flex;
		flex-direction: column;
		gap: 2px;
		animation: menu-in 160ms var(--m3-timing-function-emphasized-decel);
	}

	@keyframes menu-in {
		from {
			opacity: 0;
			transform: translateY(-4px) scaleY(0.96);
		}
	}

	.item {
		@apply --m3-label-large;
		@apply --m3-focus-inward;
		display: flex;
		flex: none;
		align-items: center;
		gap: 12px;
		height: 44px;
		padding: 0 12px 0 8px;
		border: 0;
		border-radius: var(--m3-shape-medium);
		background: transparent;
		color: var(--m3c-on-surface);
		text-align: left;
		cursor: pointer;
		white-space: nowrap;
	}

	.item.selected {
		background-color: var(--m3c-secondary-container);
		color: var(--m3c-on-secondary-container);
	}

	.lead {
		display: grid;
		place-items: center;
		width: 24px;
		color: var(--m3c-on-surface-variant);
	}

	.selected .lead {
		color: inherit;
	}

	.label {
		flex: 1;
	}

	.count {
		@apply --m3-label-medium;
		min-width: 2ch;
		padding-left: 16px;
		color: var(--m3c-on-surface-variant);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	@media (forced-colors: active) {
		.item.selected {
			outline: 2px solid Highlight;
			outline-offset: -2px;
		}
	}
</style>
