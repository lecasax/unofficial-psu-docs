<script lang="ts">
	import 'm3-svelte/etc/layer';
	import { Checkbox, Icon } from 'm3-svelte';
	import iconExpand from '@ktibow/iconset-material-symbols/keyboard-arrow-down-rounded';
	import iconInfo from '@ktibow/iconset-material-symbols/info-outline-rounded';
	import SearchMenu from '#lib/ui/SearchMenu.svelte';
	import {
		EQUIPMENT,
		PLANETS,
		RACES,
		SOURCE_KINDS,
		STAR_VALUES,
		classSupport,
		classes,
		groupStyle,
		num,
		raceLimited,
		rankOfStars,
		tierOf,
		type Counts,
		type EquipmentOption,
		type Filters
	} from './model.js';

	// Every filter, grouped like an MD3 side sheet. Each option shows how many items it would
	// give with the other filters as they are; options that would give none are dimmed and
	// cannot be picked (unless already picked). Rendered in the side rail or in a modal sheet.
	let {
		filters = $bindable(),
		counts,
		recentType = null
	}: { filters: Filters; counts: Counts; recentType?: string | null } = $props();

	const id = $props.id();
	let expanded = $state<Record<string, boolean>>({});
	const isOpen = (o: EquipmentOption) =>
		expanded[o.value] ?? (filters.equipment === o.value || Boolean(o.children?.some((c) => c.value === filters.equipment)));
	const glyphOf = (o: EquipmentOption) =>
		({ all: 'all', 'cat:weapon': 'melee', 'cat:shield': 'shield', 'cat:unit': 'unit' })[o.value] ??
		groupStyle.get(o.label) ??
		'melee';

	const classOptions = $derived(
		classes.map((c) => {
			const count = counts.cls[c] ?? 0;
			return {
				value: c,
				label: c,
				count,
				support: classSupport(c),
				section: tierOf(c),
				disabled: count === 0 && filters.cls !== c
			};
		})
	);
</script>

{#snippet count(n: number)}
	<span class="count">{num(n)}</span>
{/snippet}

{#snippet equipmentItem(o: EquipmentOption, sub: boolean)}
	{@const n = counts.equipment[o.value] ?? 0}
	{@const disabled = n === 0 && filters.equipment !== o.value}
	<label class="nav-item m3-layer" class:sub class:active={filters.equipment === o.value} class:disabled>
		<input class="sr-only" type="radio" name="{id}-equipment" value={o.value} {disabled} bind:group={filters.equipment} />
		<svg class="glyph" aria-hidden="true"><use href="#g-{glyphOf(o)}" /></svg>
		<span class="text">{o.label}</span>
		{@render count(n)}
	</label>
{/snippet}

<div class="filters">
	<fieldset>
		<legend>Equipment</legend>
		<ul class="nav">
			{#each EQUIPMENT as o (o.value)}
				{@const open = isOpen(o)}
				<li>
					<div class="nav-row" class:parent={o.children}>
						{@render equipmentItem(o, false)}
						{#if o.children}
							<button
								type="button"
								class="expander m3-layer"
								class:open
								aria-expanded={open}
								aria-controls="{id}-{o.value}"
								aria-label="{o.label}: {open ? 'hide' : 'show'} types"
								onclick={() => (expanded[o.value] = !open)}
							>
								<Icon icon={iconExpand} size={20} />
							</button>
						{/if}
					</div>
					{#if o.children && open}
						<ul class="nav children" id="{id}-{o.value}">
							{#each o.children as c (c.value)}
								<li>{@render equipmentItem(c, true)}</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>
	</fieldset>

	<div class="section">
		<p class="legend" id="{id}-type">Type</p>
		<SearchMenu
			label="Type"
			placeholder="Find a type"
			noun="type"
			bind:value={filters.cls}
			reset={{ value: 'any', label: 'Any type', count: counts.cls.any ?? 0 }}
			options={classOptions}
			recent={recentType}
			data-filter-trigger="class"
			aria-describedby="{id}-type"
		/>
	</div>

	<fieldset>
		<legend>Stars and rank</legend>
		{#each STAR_VALUES as s (s)}
			{@const rank = rankOfStars(s)}
			{@const n = counts.stars[s] ?? 0}
			{@const disabled = n === 0 && !filters.stars.includes(s)}
			<label class="check m3-layer" class:disabled>
				<Checkbox><input type="checkbox" value={s} {disabled} bind:group={filters.stars} /></Checkbox>
				<span class="text">{s}★{#if rank}<span class="muted">{` · ${rank} rank`}</span>{/if}</span>
				{@render count(n)}
			</label>
		{/each}
	</fieldset>

	<fieldset>
		<legend>Planet</legend>
		{#each PLANETS as p (p)}
			{@const n = counts.planets[p] ?? 0}
			{@const disabled = n === 0 && !filters.planets.includes(p)}
			<label class="check m3-layer" class:disabled>
				<Checkbox><input type="checkbox" value={p} {disabled} bind:group={filters.planets} /></Checkbox>
				<span class="text">{p}</span>
				{@render count(n)}
			</label>
		{/each}
	</fieldset>

	<fieldset>
		<legend>Drops from</legend>
		{#each SOURCE_KINDS as s (s.key)}
			{@const n = counts.sources[s.key] ?? 0}
			{@const disabled = n === 0 && !filters.sources.includes(s.key)}
			<label class="check m3-layer" class:disabled>
				<Checkbox><input type="checkbox" value={s.key} {disabled} bind:group={filters.sources} /></Checkbox>
				<svg class="glyph" aria-hidden="true"><use href="#g-{s.kind}" /></svg>
				<span class="text">{s.label}</span>
				{@render count(n)}
			</label>
		{/each}
	</fieldset>

	{#if raceLimited}
		<fieldset>
			<legend>Race</legend>
			{#each ['any', ...RACES] as r (r)}
				<label class="check m3-layer">
					<input class="radio" type="radio" name="{id}-race" value={r} bind:group={filters.race} />
					<span class="text">{r === 'any' ? 'Any race' : r}</span>
					{@render count(counts.race[r] ?? 0)}
				</label>
			{/each}
		</fieldset>
	{:else}
		<p class="note">
			<Icon icon={iconInfo} size={18} />
			<span>
				No race filter: every weapon here can be used by all four races. The wiki has no race data for
				units and Line Shields.
			</span>
		</p>
	{/if}
</div>

<style>
	.filters {
		display: flex;
		flex-direction: column;
	}

	fieldset,
	.section {
		min-inline-size: 0;
		margin: 0;
		padding: 8px 0;
		border: 0;
	}

	.section {
		padding-bottom: 12px;
	}

	fieldset + fieldset,
	fieldset + .section,
	.section + fieldset {
		border-top: 1px solid var(--m3c-outline-variant);
	}

	legend,
	.legend {
		@apply --m3-title-small;
		float: left;
		width: 100%;
		margin: 0;
		padding: 6px 16px 6px;
		color: var(--m3c-on-surface-variant);
	}

	legend + * {
		clear: both;
	}

	.nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.nav-row {
		position: relative;
	}

	.nav-item,
	.check {
		@apply --m3-label-large;
		display: flex;
		align-items: center;
		gap: 12px;
		height: 36px;
		padding: 0 16px;
		border-radius: var(--m3-shape-full);
		color: var(--m3c-on-surface-variant);
		cursor: pointer;

		&:has(:focus-visible) {
			outline: 3px solid var(--m3c-secondary);
			outline-offset: -3px;
		}
	}

	.nav-item {
		height: 40px;
	}

	.disabled {
		cursor: default;
		opacity: 0.38;
	}

	.parent .nav-item {
		padding-right: 52px;
	}

	.nav-item.active {
		background-color: var(--m3c-secondary-container);
		color: var(--m3c-on-secondary-container);

		.text,
		.count {
			color: var(--m3c-on-surface);
		}

		.text {
			font-weight: 600;
		}
	}

	.nav-item.sub {
		height: 36px;
		padding-left: 52px;
		font-weight: 400;
	}

	.glyph {
		flex: none;
		width: 20px;
		height: 20px;
		fill: currentColor;
	}

	.sub .glyph {
		width: 16px;
		height: 16px;
		opacity: 0.8;
	}

	.text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		color: var(--m3c-on-surface);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.muted {
		color: var(--m3c-on-surface-variant);
		font-weight: 400;
	}

	.count {
		@apply --m3-label-medium;
		color: var(--m3c-on-surface-variant);
		font-variant-numeric: tabular-nums;
	}

	.expander {
		position: absolute;
		top: 4px;
		right: 8px;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		padding: 0;
		border: 0;
		border-radius: var(--m3-shape-full);
		background: transparent;
		color: var(--m3c-on-surface-variant);
		cursor: pointer;

		:global(svg) {
			transition: rotate var(--m3-easing-fast);
		}

		&.open :global(svg) {
			rotate: 180deg;
		}
	}

	.children {
		margin: 2px 0 6px;
	}

	.check {
		gap: 16px;
		padding: 0 16px 0 18px;

		.glyph {
			margin-right: -4px;
			color: var(--m3c-on-surface-variant);
		}
	}

	.radio {
		width: 18px;
		height: 18px;
		margin: 0;
		accent-color: var(--m3c-primary);
	}

	.note {
		@apply --m3-body-small;
		display: flex;
		gap: 12px;
		margin: 0;
		padding: 12px 16px 16px;
		border-top: 1px solid var(--m3c-outline-variant);
		color: var(--m3c-on-surface-variant);

		:global(svg) {
			flex: none;
		}
	}
</style>
