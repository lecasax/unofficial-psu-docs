<script lang="ts">
	import { Icon } from 'm3-svelte';
	import iconInfo from '@ktibow/iconset-material-symbols/info-outline-rounded';
	import iconQuote from '@ktibow/iconset-material-symbols/format-quote-rounded';
	import iconUp from '@ktibow/iconset-material-symbols/trending-up-rounded';
	import iconDown from '@ktibow/iconset-material-symbols/trending-down-rounded';
	import iconNeutral from '@ktibow/iconset-material-symbols/radio-button-unchecked';
	import iconFire from '@ktibow/iconset-material-symbols/local-fire-department-rounded';
	import iconIce from '@ktibow/iconset-material-symbols/ac-unit-rounded';
	import iconLightning from '@ktibow/iconset-material-symbols/bolt-rounded';
	import iconGround from '@ktibow/iconset-material-symbols/landscape-rounded';
	import iconLight from '@ktibow/iconset-material-symbols/light-mode-rounded';
	import iconDark from '@ktibow/iconset-material-symbols/dark-mode-rounded';
	import type { IconData } from '#lib/ui/types.js';
	import ItemArt from './ItemArt.svelte';
	import DropSources from './DropSources.svelte';
	import type { Item, Planet } from './types.js';
	import {
		RACES,
		TIERS,
		classes,
		elementSummary,
		hasProperties,
		listing,
		minus,
		mod,
		num,
		overline,
		signed,
		signedValue,
		sources,
		tierOf
	} from './model.js';

	// Everything known about one item, in one order everywhere: picture, name, the three key
	// numbers, the spec grid, where it drops, status and elements, who can use it, and the
	// wiki's description. card = the hover card's short version (no drops, nothing to click).
	let {
		item,
		variant,
		headingId,
		planets = []
	}: { item: Item; variant: 'card' | 'pane' | 'sheet'; headingId?: string; planets?: Planet[] } = $props();

	const elementIcons: Record<string, IconData> = {
		Neutral: iconNeutral,
		Fire: iconFire,
		Ice: iconIce,
		Lightning: iconLightning,
		Ground: iconGround,
		Light: iconLight,
		Dark: iconDark
	};

	const card = $derived(variant === 'card');
	const known = $derived(hasProperties(item));
	const sourceCount = $derived(sources.get(item.id)?.length ?? 0);

	type Tile = { label: string; value: string; hint?: string; mark?: boolean; wide?: boolean };
	type Spec = { label: string; value: string };

	const twoValues = $derived(Boolean(item.unit?.stats.some((s) => s.value.includes('/'))));
	const footnote = $derived(twoValues && item.unit?.comment ? item.unit.comment : null);

	const tiles = $derived.by((): Tile[] => {
		const w = item.weapon;
		if (w) {
			const list: Tile[] = [
				{ label: `${w.powerLabel} at +${w.maxGrind}`, value: num(w.power[1]), hint: `${num(w.power[0])} at +0` }
			];
			if (w.pp) list.push({ label: `PP at +${w.maxGrind}`, value: num(w.pp[1]), hint: `${num(w.pp[0])} at +0` });
			else if (w.rcsm) list.push({ label: 'Shot', value: w.rcsm.shotType ?? '—', hint: `Delay ${num(w.rcsm.shotDelay)}` });
			list.push({ label: 'Requires', value: num(w.requirement.value), hint: w.requirement.stat });
			return list;
		}
		const s = item.shield;
		if (s) {
			const list: Tile[] = [
				{ label: 'DFP', value: num(s.def) },
				{ label: 'EVP', value: num(s.eva) }
			];
			if (s.dfpRequired !== null) list.push({ label: 'Requires', value: num(s.dfpRequired), hint: 'DFP' });
			else list.push({ label: 'MST', value: num(s.ment) });
			return list;
		}
		const u = item.unit;
		if (u) {
			const changes = u.stats.filter((st) => !/^0(\s*\/\s*0)?$/.test(st.value.trim()));
			const list: Tile[] = changes.length
				? u.stats.map((st) => ({ label: st.label, value: signedValue(st.value), mark: Boolean(footnote) && st.value.includes('/') }))
				: [{ label: 'Stat changes', value: 'None', wide: true }];
			list.push({ label: 'Slot', value: u.slot });
			return list;
		}
		return [];
	});

	const specs = $derived.by((): Spec[] => {
		const w = item.weapon;
		if (w) {
			const list: (Spec | false)[] = [
				w.accuracy !== null && { label: 'Accuracy', value: num(w.accuracy) },
				{ label: 'Variance', value: num(w.variance) },
				w.range !== null && { label: 'Range', value: num(w.range) },
				{ label: 'PA mod', value: mod(w.paMod) },
				w.critMod !== null && { label: 'Crit mod', value: mod(w.critMod) },
				w.seMod !== null && { label: 'SE mod', value: mod(w.seMod) },
				{ label: 'Max targets', value: num(w.maxTargets) },
				w.penetration !== null && { label: 'Penetrates', value: w.penetration ? 'Yes' : 'No' }
			];
			return list.filter((s) => s !== false);
		}
		const s = item.shield;
		if (s) {
			const open = Object.values(s.slots).filter(Boolean).length;
			const list: Spec[] = [
				{ label: 'MST', value: num(s.ment) },
				{ label: 'STA', value: num(s.end) },
				{ label: 'Element', value: s.element ?? '—' },
				{ label: 'Unit slots', value: `${open} of ${Object.keys(s.slots).length}` }
			];
			return list;
		}
		return [];
	});

	const tiers = $derived.by(() => {
		const list = item.classes ?? [];
		return TIERS.map((t) => ({ tier: t.replace(/ Types$/, ''), classes: list.filter((c) => tierOf(c) === t) })).filter(
			(t) => t.classes.length
		);
	});

	const statusOf = (s: { name: string; level: number; elements: string[] }, all: string[]) =>
		s.elements.length < all.length ? `with ${listing(s.elements)}` : null;
</script>

{#snippet starsGrade()}
	{#if item.stars || item.rank}
		<p class="grade">
			{#if item.stars}
				<span>{item.stars}<span class="star" aria-hidden="true">★</span><span class="sr-only">{' stars'}</span></span>
			{/if}
			{#if item.stars && item.rank}<span aria-hidden="true">·</span>{/if}
			{#if item.rank}<span>{item.rank} rank</span>{/if}
		</p>
	{/if}
{/snippet}

{#snippet elementRow(list: string[])}
	<span class="elements">
		<span class="element-icons" aria-hidden="true">
			{#each list as e (e)}
				<span class="element" title={e}><Icon icon={elementIcons[e]} size={16} /></span>
			{/each}
		</span>
		<span class="element-text">{elementSummary(list)}</span>
	</span>
{/snippet}

<article class="detail {variant}" aria-labelledby={headingId}>
	<ItemArt {item} size={card ? 'card' : 'panel'} credit={card ? 'text' : 'link'} />

	<div class="body">
		<header class="head">
			<p class="overline">{overline(item)}</p>
			<h2 class="title" id={headingId} tabindex="-1">{item.name}</h2>
			{@render starsGrade()}
		</header>

		{#if !known}
			<div class="nodata" role="note">
				<Icon icon={iconInfo} size={20} />
				<div>
					<p class="nodata-title">No data on the wiki</p>
					{#if !card}
						<p>
							The wiki has no properties or picture for this item.
							{#if sourceCount === 1}Its drop source is listed below.{:else if sourceCount > 1}Its drop sources are listed below.{:else}It
								has no drop source listed either.{/if}
						</p>
					{:else}
						<p>The wiki has no properties or picture for this item.</p>
					{/if}
				</div>
			</div>
		{/if}

		{#if tiles.length}
			<div class="tiles">
				{#each tiles as t (t.label)}
					<div class="tile" class:wide={t.wide}>
						<span class="tile-label">{t.label}</span>
						<span class="tile-value" class:long={t.value.length > 7}>{t.value}{#if t.mark}<sup aria-hidden="true">*</sup>{/if}</span>
						{#if t.hint}<span class="tile-hint">{t.hint}</span>{/if}
					</div>
				{/each}
			</div>
			{#if footnote && !card}
				<p class="footnote"><span aria-hidden="true">*</span>{footnote}</p>
			{/if}
		{/if}

		{#if specs.length}
			<dl class="specs">
				{#each specs as s (s.label)}
					<div class="spec"><dt>{s.label}</dt><dd>{s.value}</dd></div>
				{/each}
			</dl>
		{/if}

		{#if card}
			{#if item.weapon}{@render elementRow(item.weapon.elements)}{/if}
			<p class="hint">Click for drops and all details</p>
		{:else}
			<DropSources {item} {planets} />

			{#if item.weapon}
				{@const w = item.weapon}
				<section class="block">
					<h3>Status and elements</h3>
					<dl class="kv">
						<div>
							<dt>Status</dt>
							<dd>
								{#each w.status as s (s.name + s.elements.join())}
									{@const extra = statusOf(s, w.elements)}
									<span class="line">{s.name} · Lv {s.level}{#if extra}<span class="muted">{extra}</span>{/if}</span>
								{:else}
									<span class="muted">None</span>
								{/each}
							</dd>
						</div>
						<div>
							<dt>Elements</dt>
							<dd>{@render elementRow(w.elements)}</dd>
						</div>
						{#if Object.keys(w.bonuses).length}
							<div>
								<dt>Bonuses</dt>
								<dd>{Object.entries(w.bonuses).map(([k, v]) => `${signed(v)} ${k}`).join(', ')}</dd>
							</div>
						{/if}
						{#if w.races.length && w.races.length < RACES.length}
							<div><dt>Races</dt><dd>{w.races.join(', ')} only</dd></div>
						{/if}
						{#if w.sexes.length === 1}
							<div><dt>Gender</dt><dd>{w.sexes[0]} only</dd></div>
						{/if}
					</dl>
				</section>
			{:else if item.unit}
				{@const u = item.unit}
				<section class="block">
					<h3>Effects</h3>
					{#if u.effects.length}
						<ul class="effects">
							{#each u.effects as e (e.text)}
								<li class:up={e.up === true} class:down={e.up === false}>
									{#if e.up !== null}
										<Icon icon={e.up ? iconUp : iconDown} size={18} />
										<span class="sr-only">{e.up ? 'Improved:' : 'Diminished:'}</span>
									{/if}
									<span>{minus(e.text.replace(/^[↑↓]\s*/, ''))}</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="muted">None listed on the wiki</p>
					{/if}
					<p class="muted small">Goes in the {u.slot} slot of a Line Shield.</p>
					{#if u.comment && !footnote}<p class="note">{u.comment}</p>{/if}
				</section>
			{:else if item.shield}
				{@const s = item.shield}
				<section class="block">
					<h3>Unit slots</h3>
					<p class="slots">
						{#each Object.entries(s.slots) as [slot, open] (slot)}
							<span class="slot" class:open>{slot}<span class="sr-only">{open ? ' open' : ' closed'}</span></span>
						{/each}
					</p>
					{#if s.comment}
						{#each s.comment.split('\n') as line, i (i)}<p class="note">{line}</p>{/each}
					{/if}
				</section>
			{/if}

			{#if item.classes}
				<section class="block">
					<h3>Usable by</h3>
					{#if item.classes.length === classes.length}
						<p>Every type</p>
					{:else if item.classes.length === 0}
						<p>No type, according to the wiki's weapon table</p>
					{:else}
						<dl class="kv tiers">
							{#each tiers as t (t.tier)}
								<div><dt>{t.tier}</dt><dd>{t.classes.join(', ')}</dd></div>
							{/each}
						</dl>
					{/if}
				</section>
			{/if}

			{#if item.weapon?.description}
				<blockquote>
					<Icon icon={iconQuote} size={20} />
					<p>{item.weapon.description}</p>
				</blockquote>
			{/if}
		{/if}
	</div>
</article>

<style>
	.detail {
		color: var(--m3c-on-surface);
		container-type: inline-size;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 16px 24px 24px;
	}

	.card .body {
		gap: 12px;
		padding: 12px 16px 14px;
	}

	.sheet .body {
		padding: 16px 16px 24px;
	}

	p {
		margin: 0;
	}

	.head {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.overline {
		@apply --m3-label-medium;
		color: var(--m3c-primary);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.title {
		@apply --m3-title-large;
		margin: 0;
		border-radius: var(--m3-shape-extra-small);
		outline: none;
		overflow-wrap: anywhere;
	}

	.title:focus-visible {
		outline: 2px solid var(--m3c-secondary);
		outline-offset: 2px;
	}

	.grade {
		@apply --m3-label-large;
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--m3c-on-surface-variant);
		font-variant-numeric: tabular-nums;
	}

	.star {
		color: var(--m3c-tertiary);
	}

	/* --- No data --- */

	.nodata {
		display: flex;
		gap: 12px;
		padding: 12px 16px;
		border-radius: var(--m3-shape-medium);
		background-color: var(--m3c-surface-container);
		color: var(--m3c-on-surface-variant);

		:global(svg) {
			flex: none;
			margin-top: 1px;
		}

		p {
			@apply --m3-body-medium;
		}
	}

	.nodata-title {
		@apply --m3-title-small;
		margin-bottom: 2px;
		color: var(--m3c-on-surface);
	}

	/* --- Key numbers --- */

	.tiles {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}

	.tile {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: 10px 12px;
		border-radius: var(--m3-shape-medium);
		background-color: var(--tile, var(--m3c-surface-container));
	}

	.tile.wide {
		grid-column: span 2;
	}

	.card .tile {
		padding: 8px 10px;
	}

	.tile-label {
		@apply --m3-label-medium;
		color: var(--m3c-on-surface-variant);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tile-value {
		@apply --m3-title-large;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;

		sup {
			margin-left: 1px;
			font-size: 0.7em;
			color: var(--m3c-on-surface-variant);
		}
	}

	.card .tile-value,
	.tile-value.long {
		@apply --m3-title-medium;
		font-weight: 500;
	}

	.tile-hint {
		@apply --m3-body-small;
		color: var(--m3c-on-surface-variant);
		font-variant-numeric: tabular-nums;
	}

	.footnote {
		@apply --m3-body-small;
		margin-top: -12px;
		color: var(--m3c-on-surface-variant);
	}

	/* --- Spec grid: borderless, four columns --- */

	dl {
		margin: 0;
	}

	dd {
		margin: 0;
	}

	.specs {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px 12px;
	}

	.spec {
		display: flex;
		flex-direction: column;
		min-width: 0;

		dt {
			@apply --m3-label-medium;
			color: var(--m3c-on-surface-variant);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		dd {
			@apply --m3-title-small;
			font-variant-numeric: tabular-nums;
		}
	}

	/* --- Sections --- */

	.block {
		display: flex;
		flex-direction: column;
		gap: 10px;

		h3 {
			@apply --m3-title-medium;
			margin: 0;
		}

		> p {
			@apply --m3-body-medium;
		}
	}

	.kv {
		@apply --m3-body-medium;
		display: flex;
		flex-direction: column;
		gap: 8px;

		> div {
			display: grid;
			grid-template-columns: 88px minmax(0, 1fr);
			gap: 12px;
		}

		dt {
			color: var(--m3c-on-surface-variant);
		}
	}

	.line {
		display: flex;
		flex-wrap: wrap;
		gap: 0 8px;
	}

	.muted {
		color: var(--m3c-on-surface-variant);
	}

	.small {
		@apply --m3-body-small;
	}

	.note {
		@apply --m3-body-small;
		color: var(--m3c-on-surface-variant);
	}

	/* One row of the elements the weapon can have, then the short summary. */
	.elements {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 10px;
	}

	.element-icons {
		display: flex;
		gap: 4px;
	}

	.element {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: var(--m3-shape-full);
		background-color: var(--m3c-surface-container-high);
		color: var(--m3c-on-surface-variant);
	}

	.element-text {
		@apply --m3-body-medium;
		color: var(--m3c-on-surface);
	}

	.card .element {
		width: 24px;
		height: 24px;
	}

	.effects {
		@apply --m3-body-medium;
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;

		li {
			display: flex;
			align-items: flex-start;
			gap: 8px;
		}

		:global(svg) {
			flex: none;
			margin-top: 1px;
		}

		.up :global(svg) {
			color: var(--m3c-primary);
		}

		.down :global(svg) {
			color: var(--m3c-error);
		}
	}

	.slots {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.slot {
		@apply --m3-label-large;
		padding: 4px 12px;
		border-radius: var(--m3-shape-small);
		outline: 1px solid var(--m3c-outline-variant);
		outline-offset: -1px;
		color: var(--m3c-on-surface-variant);
		text-transform: capitalize;
	}

	.slot.open {
		outline: 0;
		background-color: var(--m3c-secondary-container);
		color: var(--m3c-on-secondary-container);
	}

	.tiers dd {
		color: var(--m3c-on-surface);
	}

	blockquote {
		display: flex;
		gap: 8px;
		margin: 0;
		color: var(--m3c-on-surface-variant);

		:global(svg) {
			flex: none;
			color: var(--m3c-on-surface-variant);
		}

		p {
			@apply --m3-body-medium;
			font-style: italic;
		}
	}

	.hint {
		@apply --m3-label-small;
		color: var(--m3c-on-surface-variant);
	}

	/* Narrow panels (and the card): three spec columns, so labels never get cut. */
	@container (width < 400px) {
		.body {
			padding-right: 20px;
			padding-left: 20px;
		}

		.card .body {
			padding-right: 16px;
			padding-left: 16px;
		}

		.specs {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.tile {
			padding: 10px;
		}
	}
</style>
