<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { Item, Planet } from './types.js';
	import {
		SOURCE_KINDS,
		groupRequirement,
		groupStyle,
		highlight,
		rowLabel,
		rowMeta,
		sources,
		type Group
	} from './model.js';

	// The results as one listbox: wiki sections are option groups, every item is an option.
	// All rows are rendered once; filtering only hides them, sorting only moves them. One
	// listener on the list handles clicks, focus and the arrow keys for every row.
	let {
		groups,
		visible,
		order,
		selectedId,
		openId,
		tabId,
		hint,
		query,
		planets,
		covered = false,
		attach,
		onchoose,
		onfocusrow,
		onblurlist
	}: {
		groups: Group[];
		visible: Set<string>;
		/** Visible items in screen order, for the arrow keys. */
		order: Item[];
		/** The item shown in the side panel (marked only while the panel is on screen). */
		selectedId: string | null;
		/** The item whose dialog or sheet is open. */
		openId: string | null;
		/** The one row in the tab order. */
		tabId: string | null;
		/** How the keyboard works here, for assistive tech. */
		hint: string;
		query: string;
		planets: Planet[];
		/** A full-screen sheet hides the list: skip rendering it until the sheet closes. */
		covered?: boolean;
		attach?: Attachment<HTMLElement>;
		onchoose: (item: Item, keyboard: boolean) => void;
		onfocusrow: (item: Item) => void;
		onblurlist: () => void;
	} = $props();

	const searching = $derived(query.trim() !== '');
	const kindLabel = Object.fromEntries(SOURCE_KINDS.map((k) => [k.kind, k.label]));
	const MAX_SOURCES = 3;
	const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
	const rowOf = (target: EventTarget | null) => (target as Element | null)?.closest<HTMLElement>('[role="option"]') ?? null;
	const itemOf = (row: HTMLElement | null) => (row ? order.find((i) => i.id === row.dataset.id) : undefined);

	function onclick(e: MouseEvent) {
		const item = itemOf(rowOf(e.target));
		if (item) onchoose(item, e.detail === 0);
	}

	function onfocusin(e: FocusEvent) {
		const item = itemOf(rowOf(e.target));
		if (item) onfocusrow(item);
	}

	function onfocusout(e: FocusEvent) {
		const list = e.currentTarget as HTMLElement;
		if (!list.contains(e.relatedTarget as Node | null)) onblurlist();
	}

	const STEPS: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 10, PageUp: -10 };
	function onkeydown(e: KeyboardEvent) {
		const row = rowOf(e.target);
		if (!row || e.altKey || e.ctrlKey || e.metaKey) return;
		const i = order.findIndex((it) => it.id === row.dataset.id);
		let next: number;
		if (e.key in STEPS) next = Math.min(order.length - 1, Math.max(0, i + STEPS[e.key]));
		else if (e.key === 'Home') next = 0;
		else if (e.key === 'End') next = order.length - 1;
		else return;
		e.preventDefault();
		const target = document.getElementById(`opt-${order[next].id}`);
		target?.focus({ preventScroll: true });
		target?.scrollIntoView({ block: 'nearest' });
	}
</script>

{#snippet marked(text: string, on: boolean)}
	{#if on && searching}
		{#each highlight(text, query) as part, i (i)}{#if part.match}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}
	{:else}
		{text}
	{/if}
{/snippet}

<p class="sr-only" id="list-hint">{hint}</p>
<!-- Keyboard: the rows are buttons (Enter, Space); the list adds the arrow keys. -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
	class="list"
	class:covered
	id="results"
	role="listbox"
	aria-label="Items"
	aria-describedby="list-hint"
	{@attach attach}
	{onclick}
	{onfocusin}
	{onfocusout}
	{onkeydown}
>
	{#each groups as g (g.name)}
		{@const shown = g.items.filter((i) => visible.has(i.id)).length}
		{@const requirement = groupRequirement.get(g.name)}
		<section class="group" role="group" aria-labelledby="group-{slug(g.name)}" hidden={shown === 0}>
			<div class="group-sticky">
				<div class="group-head" id="group-{slug(g.name)}" role="presentation">
					<span class="group-glyph"><svg aria-hidden="true"><use href="#g-{groupStyle.get(g.name)}" /></svg></span>
					<span class="group-name">{g.name}</span>
					<span class="group-count">{shown}<span class="sr-only">{' items'}</span></span>
					{#if requirement}<span class="group-req">{requirement}</span>{/if}
				</div>
			</div>
			<ul class="rows" role="none">
				{#each g.items as item (item.id)}
					{@const on = visible.has(item.id)}
					{@const meta = rowMeta(item)}
					{@const list = sources.get(item.id) ?? []}
					<li role="none" hidden={!on}>
						<button
							type="button"
							class="row m3-layer"
							class:open={item.id === openId}
							class:nodata={!item.stars && !item.weapon}
							role="option"
							id="opt-{item.id}"
							data-id={item.id}
							data-item-trigger={item.name}
							aria-selected={item.id === selectedId}
							aria-label={rowLabel(item)}
							aria-describedby="meta-{item.id} drops-{item.id}"
							tabindex={item.id === tabId ? 0 : -1}
						>
							<span class="bar" aria-hidden="true"></span>
							<span class="who">
								<span class="tile {item.style}" aria-hidden="true"><svg><use href="#g-{item.style}" /></svg></span>
								<span class="who-text">
									<span class="name">{@render marked(item.name, on)}</span>
									<span class="meta" id="meta-{item.id}">
										{#if meta.stars}
											<span class="part" class:sep={!meta.rankChip && meta.parts.length > 0}
												>{meta.stars}<span class="star">★</span></span
											>
										{/if}
										{#if meta.rankChip}
											<span class="part" class:sep={meta.parts.length > 0}
												><span class="rank-chip">{meta.rankChip}<span class="sr-only">{' rank'}</span></span></span
											>
										{/if}
										{#each meta.parts as part, i (i)}<span class="part" class:sep={i < meta.parts.length - 1}>{part}</span>{/each}
									</span>
								</span>
							</span>
							<span class="drops" id="drops-{item.id}">
								{#each list.slice(0, MAX_SOURCES) as s, i (i)}
									{@const away = planets.length > 0 && !s.planets.some((p) => planets.includes(p))}
									<!-- One run of text: the planet is glued to what precedes it, so a wrapped line
									     never starts with its separator. -->
									<span class="drop" class:away>
										<svg class="kind-glyph" aria-hidden="true"><use href="#g-{s.kind}" /></svg>
										<span class="drop-text"
											><span class="kind">{kindLabel[s.kind]}<span class="sr-only">{': '}</span></span
											><span class="drop-name">{@render marked(s.name, on)}</span
											>{#if s.rare}{' '}<span class="tag rare">Rare</span>{/if}{#if s.boss}{' '}<span class="tag">Boss</span
												>{/if}{#if s.box}{' '}<span class="tag">{s.box}</span>{/if}<span
												class="planet"
												class:unlisted={!s.planet}><span class="sr-only">{', '}</span>{s.planet ?? 'planet not listed'}</span
											></span
										>
									</span>
								{:else}
									<span class="drop none">No drop source listed</span>
								{/each}
								{#if list.length > MAX_SOURCES}
									<span class="more">+{list.length - MAX_SOURCES} more</span>
								{/if}
							</span>
							<svg class="chevron" aria-hidden="true"><use href="#g-chevron" /></svg>
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		/* Remembered while rendered, so skipping it keeps the page height and scroll position. */
		contain-intrinsic-block-size: auto 4000px;
	}

	.list.covered {
		content-visibility: hidden;
	}

	.group[hidden] {
		display: none;
	}


	/* --- Section headers: pinned under the toolbar while their section scrolls --- */

	.group-sticky {
		position: sticky;
		top: calc(var(--app-bar-height) + var(--toolbar-h, 0px));
		z-index: 2;
		container-type: scroll-state;
	}

	.group-head {
		@apply --m3-title-medium;
		display: flex;
		align-items: center;
		gap: 12px;
		height: 48px;
		padding: 0 16px 0 8px;
		border-bottom: 1px solid transparent;
		background-color: var(--list-bg, var(--app-pane));
		color: var(--m3c-on-surface);
		font-weight: 500;
	}

	@container scroll-state(stuck: top) {
		.group-head {
			border-bottom-color: var(--m3c-outline-variant);
		}
	}

	.group-glyph {
		display: grid;
		flex: none;
		place-items: center;
		width: 28px;
		height: 28px;
		margin-left: 6px;
		border-radius: var(--m3-shape-small);
		background-color: var(--m3c-secondary-container);
		color: var(--m3c-on-secondary-container);

		svg {
			width: 18px;
			height: 18px;
			fill: currentColor;
		}
	}

	.group-count {
		@apply --m3-label-medium;
		padding: 1px 8px;
		border-radius: var(--m3-shape-full);
		background-color: var(--m3c-surface-container-high);
		color: var(--m3c-on-surface-variant);
		font-variant-numeric: tabular-nums;
	}

	.group-req {
		@apply --m3-body-small;
		margin-left: auto;
		color: var(--m3c-on-surface-variant);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	/* --- Rows --- */

	.rows {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li[hidden] {
		display: none;
	}

	/* The first section on screen renders in full; rows of the sections after it skip layout
	   and paint until they come near the viewport (showing all items again takes about 80 ms
	   instead of 110 ms at 4x CPU throttling). Find-in-page and assistive tech still see them. */
	.group:not([hidden]) ~ .group li {
		content-visibility: auto;
		contain-intrinsic-size: auto 88px;
	}

	.row {
		display: grid;
		grid-template-columns: minmax(0, 21.5rem) minmax(0, 1fr);
		gap: 16px;
		align-items: start;
		width: 100%;
		padding: 0 16px 0 8px;
		border: 0;
		border-radius: var(--m3-shape-large);
		background: transparent;
		color: var(--m3c-on-surface);
		font: inherit;
		text-align: left;
		cursor: pointer;
		scroll-margin-top: calc(var(--app-bar-height) + var(--toolbar-h, 0px) + 56px);
		scroll-margin-bottom: 16px;
	}

	.row:focus-visible {
		outline: 3px solid var(--m3c-secondary);
		outline-offset: -3px;
		animation: none;
	}

	/* The item shown in the panel: tonal fill plus a bar on the leading edge (the fill alone
	   is too faint against the pane). Only where the panel is on screen, so the prerendered
	   page shows no selection on phones; there, the item whose details are open is marked. */
	.bar {
		position: absolute;
		top: 10px;
		bottom: 10px;
		left: 0;
		width: 3px;
		border-radius: 0 3px 3px 0;
		background-color: var(--m3c-primary);
		opacity: 0;
	}

	@media (width >= 840px) {
		.row[aria-selected='true'] {
			background-color: var(--m3c-secondary-container);

			.bar {
				opacity: 1;
			}

			.tile {
				background-color: var(--m3c-primary);
				color: var(--m3c-on-primary);
			}
		}
	}

	.row.open {
		background-color: var(--m3c-secondary-container);

		.bar {
			opacity: 1;
		}
	}

	/* Above the state layer's hit box, so the pointer reaches the text. */
	.who,
	.drops {
		position: relative;
	}

	.who {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 60px;
		padding: 8px 0 8px 8px;
		box-sizing: border-box;
	}

	.tile {
		display: grid;
		flex: none;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: var(--m3-shape-medium);
		background-color: var(--m3c-secondary-container-subtle);
		color: var(--m3c-on-secondary-container-subtle);

		svg {
			width: 20px;
			height: 20px;
			fill: currentColor;
		}
	}

	.tile.shield,
	.tile.unit {
		background-color: var(--m3c-surface-container-highest);
		color: var(--m3c-on-surface-variant);
	}

	.who-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.name {
		@apply --m3-title-small;
		overflow-wrap: anywhere;
	}

	.meta {
		@apply --m3-body-small;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0 5px;
		color: var(--m3c-on-surface-variant);
		font-variant-numeric: tabular-nums;
	}

	.part {
		white-space: nowrap;
	}

	/* The dot ends the part before it, so a wrapped line never starts with one. */
	.sep::after {
		content: '·';
		margin-left: 5px;
	}

	.star {
		color: var(--m3c-tertiary);
	}

	.rank-chip {
		@apply --m3-label-small;
		display: inline-grid;
		place-items: center;
		min-width: 18px;
		height: 16px;
		padding: 0 4px;
		box-sizing: border-box;
		border-radius: var(--m3-shape-extra-small);
		outline: 1px solid var(--m3c-outline);
		outline-offset: -1px;
		color: var(--m3c-on-surface-variant);
		font-weight: 500;
	}

	/* --- Drop sources: one per line, at most three --- */

	.drops {
		@apply --m3-body-medium;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 4px;
		min-height: 60px;
		padding: 8px 0;
		box-sizing: border-box;
	}

	.drop {
		display: grid;
		grid-template-columns: 16px minmax(0, 1fr);
		align-items: start;
		gap: 6px;
		min-height: 20px;
	}

	.kind-glyph {
		width: 16px;
		height: 16px;
		margin-top: 2px;
		fill: var(--m3c-on-surface-variant);
	}

	/* The kind is shown by the icon here, and spelled out in the stacked layout. */
	.kind {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.drop-name {
		color: var(--m3c-on-surface);
	}

	.away .drop-name {
		color: var(--m3c-on-surface-variant);
	}

	.planet {
		@apply --m3-body-small;
		color: var(--m3c-on-surface-variant);
		white-space: nowrap;
	}

	.planet::before {
		content: '\00a0·\00a0';
	}

	.unlisted {
		font-style: italic;
	}

	.drop.none {
		display: block;
		color: var(--m3c-on-surface-variant);
	}

	.more {
		@apply --m3-label-medium;
		padding-left: 22px;
		color: var(--m3c-on-surface-variant);
	}

	mark {
		border-radius: 2px;
		background-color: var(--m3c-primary-container-subtle);
		color: var(--m3c-on-primary-container-subtle);
	}

	/* Inline (not inline-block), so no line can break between a tag and the planet after it. */
	.tag {
		@apply --m3-label-small;
		display: inline;
		margin-left: 2px;
		padding: 1px 6px;
		border-radius: var(--m3-shape-extra-small);
		outline: 1px solid var(--m3c-outline-variant);
		outline-offset: -1px;
		color: var(--m3c-on-surface-variant);
		white-space: nowrap;
	}

	.tag.rare {
		outline: 0;
		background-color: var(--m3c-tertiary-container-subtle);
		color: var(--m3c-on-tertiary-container-subtle);
	}

	.chevron {
		display: none;
	}

	/* --- Stacked: the drops go under the name when the list is narrow --- */

	@container results (width < 620px) {
		.row {
			grid-template-columns: minmax(0, 1fr);
			gap: 0;
			padding-bottom: 10px;
		}

		.drops {
			min-height: 0;
			padding: 0 0 0 60px;
			gap: 6px;
		}

		.drop-text {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 2px 6px;
		}

		.tag {
			margin-left: 0;
		}

		.kind {
			@apply --m3-label-medium;
			position: static;
			flex: none;
			width: auto;
			height: auto;
			overflow: visible;
			clip-path: none;
			color: var(--m3c-on-surface-variant);
		}

		.drop-name {
			min-width: 0;
		}

		.planet {
			@apply --m3-label-small;
			flex: none;
			margin-left: auto;
			padding: 0 8px;
			border-radius: var(--m3-shape-full);
			outline: 1px solid var(--m3c-outline-variant);
			outline-offset: -1px;
			line-height: 18px;
		}

		.planet::before {
			content: none;
		}

		/* No planet: quiet text, not a pill. */
		.planet.unlisted {
			padding: 0 2px;
			outline: 0;
		}

		.more {
			padding-left: 0;
		}

		.group-req {
			display: none;
		}
	}

	/* Touch: each card ends with a chevron, since a tap opens the item. */
	@media (pointer: coarse) {
		@container results (width < 620px) {
			.row {
				padding-right: 40px;
			}

			.chevron {
				position: absolute;
				top: 18px;
				right: 10px;
				display: block;
				width: 24px;
				height: 24px;
				fill: var(--m3c-on-surface-variant);
			}
		}
	}

	@media (forced-colors: active) {
		.row:focus-visible {
			outline: 3px solid CanvasText;
		}

		.row[aria-selected='true'],
		.row.open {
			outline: 2px solid Highlight;
			outline-offset: -2px;
		}
	}
</style>
