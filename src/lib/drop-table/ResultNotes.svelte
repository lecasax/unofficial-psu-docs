<script lang="ts">
	import { Button, Chip, Icon, Switch } from 'm3-svelte';
	import iconInfo from '@ktibow/iconset-material-symbols/info-outline-rounded';
	import iconPlanet from '@ktibow/iconset-material-symbols/planet-outline-rounded';
	import iconFilter from '@ktibow/iconset-material-symbols/filter-list-rounded';
	import iconOpen from '@ktibow/iconset-material-symbols/open-in-new-rounded';
	import type { Planet } from './types.js';
	import {
		SOURCE_KINDS,
		classProfile,
		listing,
		num,
		plural,
		suggestions,
		type Filters
	} from './model.js';
	import { sourceIcons } from './glyphs.js';

	// Notes between the toolbar and the results, all computed from the data:
	// - what a type can use here, when that makes the list short or empty;
	// - items a planet filter cannot place, because the wiki lists no planet for a source;
	// - search shortcuts: a type or planet named in the search, a drop source named exactly.
	let {
		filters = $bindable(),
		result,
		onquery
	}: {
		filters: Filters;
		result: {
			visible: { category: string }[];
			unknown: number;
			unlisted: number;
		};
		/** Replaces the search text (a suggestion turns it into a filter). */
		onquery: (text: string) => void;
	} = $props();

	const profile = $derived(filters.cls === 'any' ? null : classProfile(filters.cls));
	const visibleGear = $derived({
		shields: result.visible.filter((i) => i.category === 'shield').length,
		units: result.visible.filter((i) => i.category === 'unit').length
	});

	const classSentence = $derived.by(() => {
		const p = profile;
		if (!p) return null;
		if (p.weapons === 0) {
			const low = p.lowest ? ` every one is ${p.lowest.rank} rank (${p.lowest.stars}★) or higher.` : '';
			const gear = [
				visibleGear.shields && plural(visibleGear.shields, 'Line Shield'),
				visibleGear.units && plural(visibleGear.units, 'unit')
			].filter(Boolean) as string[];
			const fits = gear.length && p.gearFitsAll ? ` The ${listing(gear)} below fit every type.` : '';
			return `No weapon in this table is usable by the ${p.cls} type:${low}${fits}`;
		}
		if (p.onlyS) {
			const first = `${p.cls} can use only the S-rank weapons here (${num(p.weapons)}).`;
			if (p.excludedA.count === 0) return first;
			const where = p.excludedA.groups.length <= 4 ? listing(p.excludedA.groups) : 'weapons of its weapon types';
			return `${first} The ${num(p.excludedA.count)} A-rank ${where} are not listed.`;
		}
		return null;
	});

	const showClassNote = $derived(Boolean(classSentence) || result.unknown > 0);
	const hint = $derived(suggestions(filters.query));
	const kindLabel = Object.fromEntries(SOURCE_KINDS.map((k) => [k.kind, k.label]));

	function filterByType(cls: string) {
		filters.cls = cls;
		onquery('');
	}

	function filterByPlanet(p: Planet) {
		if (!filters.planets.includes(p)) filters.planets = [...filters.planets, p];
		onquery('');
	}
</script>

{#if hint.classes.length || hint.planets.length}
	<div class="suggest" aria-label="Search suggestions" role="group">
		{#each hint.classes as c (c)}
			<Chip variant="assist" icon={iconFilter} onclick={() => filterByType(c)}>{c} is a type: filter by it</Chip>
		{/each}
		{#each hint.planets as p (p)}
			<Chip variant="assist" icon={iconPlanet} onclick={() => filterByPlanet(p)}>{p}: filter by planet</Chip>
		{/each}
	</div>
{/if}

{#if hint.source}
	{@const s = hint.source}
	<div class="source-head">
		<span class="source-icon"><Icon icon={sourceIcons[s.kind]} size={24} /></span>
		<div class="source-text">
			<p class="source-kind">{kindLabel[s.kind]} · {s.planet ?? 'planet not listed'}</p>
			<p class="source-name">{s.name}</p>
			<p class="source-count">Drops {plural(s.count, 'item')} in this table</p>
		</div>
		{#if s.href}
			<Button variant="text" iconType="left" href={s.href} target="_blank" rel="noopener">
				<Icon icon={iconOpen} />Wiki page<span class="sr-only">{` of ${s.name} (opens in a new tab)`}</span>
			</Button>
		{/if}
	</div>
{/if}

{#if showClassNote}
	<div class="note" role="note">
		<Icon icon={iconInfo} size={20} />
		<div class="note-text">
			{#if classSentence}<p>{classSentence}</p>{/if}
			{#if result.unknown > 0}
				<p class:secondary={Boolean(classSentence)}>
					The wiki has no data for {plural(result.unknown, 'item')}, so the Type and Stars filters leave them out.
				</p>
			{/if}
		</div>
		{#if filters.cls !== 'any'}
			<span class="note-action">
				<Button variant="text" onclick={() => (filters.cls = 'any')}>Clear type</Button>
			</span>
		{/if}
	</div>
{/if}

{#if filters.planets.length > 0 && result.unlisted > 0}
	<div class="note" role="note">
		<Icon icon={iconPlanet} size={20} />
		<div class="note-text">
			<p>
				{#if filters.unlisted}
					Including {plural(result.unlisted, 'item')} with a drop source whose planet the wiki does not list.
				{:else}
					{plural(result.unlisted, 'more item')} {result.unlisted === 1 ? 'has' : 'have'} a drop source whose planet the
					wiki does not list.
				{/if}
			</p>
		</div>
		<label class="switch">
			<Switch bind:checked={filters.unlisted} />
			<span>Include them</span>
		</label>
	</div>
{/if}

<style>
	.suggest {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 4px 8px;
	}

	.note,
	.source-head {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin: 0 8px;
		padding: 12px 16px;
		border-radius: var(--m3-shape-large);
		background-color: var(--m3c-surface-container);
		color: var(--m3c-on-surface);

		> :global(svg) {
			flex: none;
			margin-top: 1px;
			color: var(--m3c-on-surface-variant);
		}
	}

	.note-text {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 4px;
		min-width: 0;

		p {
			@apply --m3-body-medium;
			margin: 0;
		}
	}

	.secondary {
		color: var(--m3c-on-surface-variant);
	}

	.note-action {
		flex: none;
		margin: -6px -8px -6px 0;
	}

	.switch {
		@apply --m3-label-large;
		display: flex;
		flex: none;
		align-items: center;
		gap: 12px;
		margin: -4px 0;
		cursor: pointer;
	}

	.source-head {
		align-items: center;
	}

	.source-icon {
		display: grid;
		flex: none;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: var(--m3-shape-large);
		background-color: var(--m3c-secondary-container);
		color: var(--m3c-on-secondary-container);
	}

	.source-text {
		flex: 1;
		min-width: 0;

		p {
			margin: 0;
		}
	}

	.source-kind {
		@apply --m3-label-medium;
		color: var(--m3c-on-surface-variant);
	}

	.source-name {
		@apply --m3-title-medium;
	}

	.source-count {
		@apply --m3-body-small;
		color: var(--m3c-on-surface-variant);
	}

	@media (width < 600px) {
		.note {
			flex-wrap: wrap;
		}

		.note-text {
			flex-basis: calc(100% - 32px);
		}

		.note-action,
		.switch {
			margin-left: 32px;
		}
	}
</style>
