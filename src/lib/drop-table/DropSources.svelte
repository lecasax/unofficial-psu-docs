<script lang="ts">
	import { Icon } from 'm3-svelte';
	import iconBox from '@ktibow/iconset-material-symbols/inventory-2-outline-rounded';
	import iconNote from '@ktibow/iconset-material-symbols/info-outline-rounded';
	import iconOpen from '@ktibow/iconset-material-symbols/open-in-new-rounded';
	import type { Item, Planet } from './types.js';
	import { SOURCE_KINDS, missingKinds, sources } from './model.js';
	import { sourceIcons } from './glyphs.js';

	// Every place an item drops, one source per line: what kind of source, its name (linked to
	// the wiki when the page exists), the planet the wiki gives for it, its box and Rare/Boss.
	// With a planet filter on, sources elsewhere step back to the secondary text color.
	let { item, planets = [] }: { item: Item; planets?: Planet[] } = $props();
	const id = $props.id();
	const list = $derived(sources.get(item.id) ?? []);
	const missing = $derived(missingKinds(list));
	const kindLabel = Object.fromEntries(SOURCE_KINDS.map((k) => [k.kind, k.label]));
</script>

<section class="drops" aria-labelledby="{id}-title">
	<h3 class="title" id="{id}-title">Where it drops</h3>
	{#if list.length}
		<ul>
			{#each list as s (s.kind + s.name)}
				{@const away = planets.length > 0 && !s.planets.some((p) => planets.includes(p))}
				<li class:away>
					<span class="kind-icon"><Icon icon={sourceIcons[s.kind]} size={20} /></span>
					<div class="text">
						<p class="name-line">
							{#if s.href}
								<a href={s.href} target="_blank" rel="noopener">
									{s.name}<Icon icon={iconOpen} size={14} /><span class="sr-only">{' (wiki, opens in a new tab)'}</span>
								</a>
							{:else}
								<span class="name">{s.name}</span>
							{/if}
							{#if s.rare}<span class="tag rare">Rare</span>{/if}
							{#if s.boss}<span class="tag">Boss</span>{/if}
							{#if s.box}<span class="tag"><Icon icon={iconBox} size={14} />{s.box}</span>{/if}
						</p>
						<p class="sub">
							{kindLabel[s.kind]}<span aria-hidden="true">{' · '}</span><span class="sr-only">{', '}</span>{#if s.planet}{s.planet}{:else}<span class="unlisted">planet not listed</span>{/if}
						</p>
						{#if s.note}
							<p class="note"><Icon icon={iconNote} size={16} />{s.note}</p>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
		{#if missing}<p class="none">{missing}</p>{/if}
	{:else}
		<p class="none">No drop source listed on the wiki</p>
	{/if}
</section>

<style>
	.drops {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.title {
		@apply --m3-title-medium;
		margin: 0;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		gap: 12px;
	}

	.kind-icon {
		display: grid;
		flex: none;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: var(--m3-shape-full);
		background-color: var(--m3c-surface-container-high);
		color: var(--m3c-on-surface-variant);
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		padding-top: 1px;
	}

	p {
		margin: 0;
	}

	.name-line {
		@apply --m3-body-medium;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 2px 8px;
		color: var(--m3c-on-surface);
		font-weight: 500;
	}

	a {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: inherit;
		text-decoration: none;

		:global(svg) {
			color: var(--m3c-on-surface-variant);
		}

		&:hover {
			color: var(--m3c-primary);
			text-decoration: underline;
			text-underline-offset: 3px;

			:global(svg) {
				color: inherit;
			}
		}
	}

	.sub {
		@apply --m3-body-small;
		color: var(--m3c-on-surface-variant);
	}

	.unlisted {
		font-style: italic;
	}

	/* With a planet filter: sources on other planets step back. */
	.away .name-line {
		color: var(--m3c-on-surface-variant);
		font-weight: 400;
	}

	.tag {
		@apply --m3-label-small;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 1px 6px;
		border-radius: var(--m3-shape-extra-small);
		outline: 1px solid var(--m3c-outline-variant);
		outline-offset: -1px;
		color: var(--m3c-on-surface-variant);
		font-weight: 500;
		white-space: nowrap;
	}

	.rare {
		outline: 0;
		background-color: var(--m3c-tertiary-container-subtle);
		color: var(--m3c-on-tertiary-container-subtle);
	}

	.note {
		@apply --m3-body-small;
		display: flex;
		gap: 6px;
		margin-top: 2px;
		color: var(--m3c-on-surface-variant);

		:global(svg) {
			flex: none;
			margin-top: 1px;
		}
	}

	.none {
		@apply --m3-body-medium;
		color: var(--m3c-on-surface-variant);
	}
</style>
