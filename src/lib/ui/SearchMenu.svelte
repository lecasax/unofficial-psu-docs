<script lang="ts" generics="T extends string">
	import 'm3-svelte/etc/layer';
	import { tick } from 'svelte';
	import { Icon } from 'm3-svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import iconArrow from '@ktibow/iconset-material-symbols/arrow-drop-down-rounded';
	import iconCheck from '@ktibow/iconset-material-symbols/check-rounded';
	import iconSearch from '@ktibow/iconset-material-symbols/search-rounded';
	import iconClear from '@ktibow/iconset-material-symbols/close-rounded';
	import { follow, placePopover } from './popover-place.js';
	import type { SearchOption } from './types.js';

	// An MD3 menu for long lists of choices, in the ARIA combobox pattern: the menu opens under
	// its button with a search field that has focus; typing filters the options (case, spaces
	// and hyphens ignored), the arrows move the active option, Enter picks it, Esc or Tab
	// closes the menu. The reset option ("Any type") is pinned first and never filtered out.
	let {
		value = $bindable(),
		options,
		reset,
		label,
		placeholder,
		noun,
		recent = null,
		onchange,
		...rest
	}: {
		value: T;
		options: SearchOption<T>[];
		reset: SearchOption<T>;
		/** Name of the choice, for the button and the list ("Type"). */
		label: string;
		/** Placeholder of the search field ("Find a type"). */
		placeholder: string;
		/** What one option is, for messages ("type"). */
		noun: string;
		/** The last choice made, offered first (active) when nothing is chosen. */
		recent?: T | null;
		onchange?: (value: T) => void;
	} & Omit<HTMLButtonAttributes, 'value' | 'onchange' | 'placeholder'> = $props();

	const id = $props.id();
	const ROW = 56;
	const HEADER = 40;
	const SEARCH = 64;
	let trigger = $state<HTMLButtonElement>();
	let menu = $state<HTMLDivElement>();
	let input = $state<HTMLInputElement>();
	let open = $state(false);
	let query = $state('');
	let active = $state<T | null>(null);
	let stopFollowing: (() => void) | undefined;

	const squash = (s: string) => s.toLowerCase().replace(/[\s-]+/g, '');
	const searching = $derived(squash(query) !== '');
	const matches = $derived(searching ? options.filter((o) => squash(o.label).includes(squash(query))) : options);
	const current = $derived(value === reset.value ? reset : options.find((o) => o.value === value));
	const sections = $derived.by(() => {
		const list: { name: string; options: SearchOption<T>[] }[] = [];
		for (const o of options) {
			const name = o.section ?? '';
			const last = list[list.length - 1];
			if (last?.name === name) last.options.push(o);
			else list.push({ name, options: [o] });
		}
		return list;
	});
	/** What the arrows move through, in screen order. */
	const navigable = $derived([reset, ...matches].filter((o) => !o.disabled));
	const optionId = (v: T) => `${id}-opt-${v.replace(/[^\w-]/g, '_')}`;
	const status = $derived(
		!searching
			? ''
			: matches.length === 0
				? `No ${noun} matches`
				: `${matches.length} ${matches.length === 1 ? `${noun} matches` : `${noun}s match`}`
	);

	const recentOption = $derived(
		recent !== null && recent !== value && value === reset.value
			? options.find((o) => o.value === recent && !o.disabled)
			: undefined
	);

	// Typing makes the first match active; an empty search goes back to the current choice, or
	// to the last one made, so Enter re-applies it.
	$effect(() => {
		if (!open) return;
		active = searching ? (matches.find((o) => !o.disabled)?.value ?? null) : (recentOption?.value ?? value);
	});

	$effect(() => {
		if (open && active !== null) document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
	});

	/** Bold the part of the label the search matched. */
	function parts(text: string) {
		const q = squash(query);
		if (!q) return [{ text, match: false }];
		const map: number[] = [];
		let squashed = '';
		for (let i = 0; i < text.length; i++) {
			if (/[\s-]/.test(text[i])) continue;
			squashed += text[i].toLowerCase();
			map.push(i);
		}
		const at = squashed.indexOf(q);
		if (at < 0) return [{ text, match: false }];
		const start = map[at];
		const end = map[at + q.length - 1] + 1;
		return [
			{ text: text.slice(0, start), match: false },
			{ text: text.slice(start, end), match: true },
			{ text: text.slice(end), match: false }
		];
	}

	const wanted = () =>
		SEARCH + 8 + Math.min(360, (options.length + 1) * ROW + sections.filter((s) => s.name).length * HEADER);
	const place = () => placePopover(trigger!, menu!, { wanted: wanted(), cap: SEARCH + 8 + 360, minWidth: 288 });

	async function ontoggle(e: ToggleEvent) {
		open = e.newState === 'open';
		stopFollowing?.();
		stopFollowing = undefined;
		if (open) {
			query = '';
			await tick();
			input?.focus({ preventScroll: true });
			if (trigger && menu) stopFollowing = follow(trigger, menu, place);
		} else {
			const focused = document.activeElement;
			if (!focused || focused === document.body || menu?.contains(focused)) trigger?.focus();
		}
	}

	function pick(o: SearchOption<T>) {
		if (o.disabled) return;
		value = o.value;
		onchange?.(o.value);
		menu?.hidePopover();
		trigger?.focus();
	}

	function move(step: number) {
		const list = navigable;
		if (!list.length) return;
		const i = list.findIndex((o) => o.value === active);
		const next = i < 0 ? (step > 0 ? 0 : list.length - 1) : (i + step + list.length) % list.length;
		active = list[next].value;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			move(e.key === 'ArrowDown' ? 1 : -1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const o = [reset, ...matches].find((x) => x.value === active);
			if (o) pick(o);
		} else if (e.key === 'Tab') {
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

{#snippet option(o: SearchOption<T>)}
	{@const selected = o.value === value}
	<!-- Options are picked with the pointer or, from the search field, with Enter. -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		id={optionId(o.value)}
		class="option m3-layer"
		class:active={o.value === active}
		class:selected
		class:disabled={o.disabled}
		role="option"
		tabindex="-1"
		aria-selected={selected}
		aria-disabled={o.disabled || undefined}
		onpointermove={() => !o.disabled && (active = o.value)}
		onclick={() => pick(o)}
	>
		<span class="check">{#if selected}<Icon icon={iconCheck} size={20} />{/if}</span>
		<span class="text">
			<span class="label">
				{#each parts(o.label) as p, i (i)}{#if p.match}<b>{p.text}</b>{:else}{p.text}{/if}{/each}
			</span>
			{#if o.support || o === recentOption}
				<span class="support">{[o.support, o === recentOption && 'Last used'].filter(Boolean).join(' · ')}</span>
			{/if}
		</span>
		{#if o.count !== undefined}<span class="count">{o.count.toLocaleString('en-US')}</span>{/if}
	</div>
{/snippet}

<button
	bind:this={trigger}
	type="button"
	class="trigger m3-layer"
	class:open
	popovertarget="{id}-menu"
	aria-haspopup="listbox"
	aria-expanded={open}
	aria-controls="{id}-menu"
	aria-label="{label}: {current?.label ?? ''}"
	onkeydown={triggerKey}
	{...rest}
>
	<span class="value">{current?.label}</span>
	<Icon icon={iconArrow} size={24} class="arrow" />
</button>

<div
	bind:this={menu}
	id="{id}-menu"
	class="menu"
	popover="auto"
	onbeforetoggle={(e) => e.newState === 'open' && place()}
	{ontoggle}
>
	<div class="search">
		<Icon icon={iconSearch} size={24} />
		<input
			bind:this={input}
			bind:value={query}
			type="text"
			role="combobox"
			aria-autocomplete="list"
			aria-expanded={open}
			aria-controls="{id}-list"
			aria-activedescendant={active !== null && navigable.some((o) => o.value === active) ? optionId(active) : undefined}
			aria-label={placeholder}
			{placeholder}
			autocomplete="off"
			spellcheck="false"
			{onkeydown}
		/>
		{#if query}
			<button
				type="button"
				class="clear m3-layer"
				tabindex="-1"
				aria-label="Clear the search"
				onmousedown={(e) => e.preventDefault()}
				onclick={() => (query = '')}
			>
				<Icon icon={iconClear} size={20} />
			</button>
		{/if}
	</div>
	<!-- The search field keeps focus while the pointer picks an option. -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="list"
		id="{id}-list"
		role="listbox"
		tabindex="-1"
		aria-label={label}
		onmousedown={(e) => e.preventDefault()}
	>
		{@render option(reset)}
		<div class="divider" role="none"></div>
		{#if searching}
			{#each matches as o (o.value)}{@render option(o)}{/each}
			{#if matches.length === 0}
				<p class="none" role="presentation">No {noun} matches “{query.trim()}”</p>
			{/if}
		{:else}
			{#each sections as s, i (s.name)}
				<div class="section" role="group" aria-labelledby={s.name ? `${id}-sec-${i}` : undefined}>
					{#if s.name}<p class="subheader" id="{id}-sec-{i}" role="presentation">{s.name}</p>{/if}
					{#each s.options as o (o.value)}{@render option(o)}{/each}
				</div>
			{/each}
		{/if}
	</div>
	<p class="sr-only" role="status">{status}</p>
</div>

<style>
	.trigger {
		@apply --m3-body-large;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		height: 48px;
		padding: 0 8px 0 16px;
		border: 0;
		border-radius: var(--m3-shape-medium);
		outline: 1px solid var(--m3c-outline);
		outline-offset: -1px;
		background: transparent;
		color: var(--m3c-on-surface);
		cursor: pointer;
		white-space: nowrap;

		&:hover {
			outline-color: var(--m3c-on-surface);
		}

		&.open {
			outline: 2px solid var(--m3c-primary);
			outline-offset: -2px;
		}

		:global(.arrow) {
			margin-left: auto;
			color: var(--m3c-on-surface-variant);
			transition: rotate var(--m3-easing-fast);
		}

		&.open :global(.arrow) {
			rotate: 180deg;
		}
	}

	.value {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.menu {
		position: fixed;
		inset: auto;
		box-sizing: border-box;
		margin: 0;
		padding: 0;
		overflow: hidden;
		border: 0;
		border-radius: var(--m3-shape-large);
		background-color: var(--app-raised);
		color: var(--m3c-on-surface);
		box-shadow: var(--m3-elevation-2);
	}

	.menu:popover-open {
		display: flex;
		flex-direction: column;
		animation: menu-in 160ms var(--m3-timing-function-emphasized-decel);
	}

	@keyframes menu-in {
		from {
			opacity: 0;
			transform: translateY(-4px) scaleY(0.97);
		}
	}

	.search {
		display: flex;
		flex: none;
		align-items: center;
		gap: 12px;
		height: 48px;
		margin: 8px 8px 4px;
		padding: 0 4px 0 16px;
		border-radius: var(--m3-shape-full);
		background-color: var(--m3c-surface-container-highest);
		color: var(--m3c-on-surface-variant);

		&:focus-within {
			outline: 2px solid var(--m3c-primary);
			outline-offset: -2px;
		}

		input {
			@apply --m3-body-large;
			flex: 1;
			min-width: 0;
			height: 100%;
			padding: 0;
			border: 0;
			outline: none;
			background: transparent;
			color: var(--m3c-on-surface);
			animation: none;

			&::placeholder {
				color: var(--m3c-on-surface-variant);
			}
		}
	}

	.clear {
		display: grid;
		flex: none;
		place-items: center;
		width: 40px;
		height: 40px;
		padding: 0;
		border: 0;
		border-radius: var(--m3-shape-full);
		background: transparent;
		color: var(--m3c-on-surface-variant);
		cursor: pointer;
	}

	.list {
		flex: 1;
		min-height: 0;
		max-height: 360px;
		padding: 0 4px 4px;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
	}

	.subheader {
		@apply --m3-label-medium;
		display: flex;
		align-items: center;
		height: 40px;
		margin: 0;
		padding: 0 12px 0 44px;
		color: var(--m3c-on-surface-variant);
	}

	.option {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 48px;
		padding: 4px 16px 4px 8px;
		box-sizing: border-box;
		border-radius: var(--m3-shape-medium);
		color: var(--m3c-on-surface);
		cursor: pointer;
	}

	.divider {
		height: 1px;
		margin: 4px 8px;
		background-color: var(--m3c-outline-variant);
	}

	/* The active option: where Enter goes. A tonal fill and a ring, visible without color too. */
	.option.active {
		background-color: color-mix(in srgb, var(--m3c-on-surface) 10%, transparent);
		box-shadow: inset 0 0 0 2px var(--m3c-secondary);
	}

	.option.selected {
		background-color: var(--m3c-secondary-container);
	}

	.option.selected.active {
		box-shadow: inset 0 0 0 2px var(--m3c-on-secondary-container);
	}

	.option.disabled {
		cursor: default;
		opacity: 0.38;
	}

	.check {
		display: grid;
		flex: none;
		place-items: center;
		width: 28px;
		color: var(--m3c-primary);
	}

	.text {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
	}

	.label {
		@apply --m3-label-large;
		font-weight: 400;

		b {
			font-weight: 700;
		}
	}

	.support {
		@apply --m3-body-small;
		color: var(--m3c-on-surface-variant);
	}

	.count {
		@apply --m3-label-medium;
		flex: none;
		min-width: 3ch;
		color: var(--m3c-on-surface-variant);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.none {
		@apply --m3-body-medium;
		margin: 0;
		padding: 12px 16px 12px 44px;
		color: var(--m3c-on-surface-variant);
	}

	@media (forced-colors: active) {
		.option.active {
			outline: 2px solid Highlight;
			outline-offset: -2px;
		}
	}
</style>
