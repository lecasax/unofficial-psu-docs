<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Icon, pathGem, pathSixSidedCookie, pathSoftBurst } from 'm3-svelte';
	import iconArrow from '@ktibow/iconset-material-symbols/arrow-forward-rounded';
	import iconOpen from '@ktibow/iconset-material-symbols/open-in-new-rounded';
	import iconCode from '@ktibow/iconset-material-symbols/code-rounded';
	import iconIdea from '@ktibow/iconset-material-symbols/lightbulb-outline-rounded';
	import iconMelee from '@ktibow/iconset-material-symbols/swords-rounded';
	import iconShield from '@ktibow/iconset-material-symbols/shield-rounded';
	import iconUnit from '@ktibow/iconset-material-symbols/memory-rounded';
	import IconButton from '#lib/ui/IconButton.svelte';
	import ShapeIcon from '#lib/ui/ShapeIcon.svelte';
	import ThemeMenu from '#lib/ui/ThemeMenu.svelte';
	import TopAppBar from '#lib/ui/TopAppBar.svelte';
	import { REPO_URL } from '#lib/site.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const stats = $derived(data.dropTable);
	const exported = $derived(
		new Date(`${stats.exported}T00:00:00Z`).toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'UTC' })
	);
	const suggestUrl = `${REPO_URL}/issues/new?${new URLSearchParams({ title: 'Page suggestion: ' })}`;
</script>

<svelte:head>
	<title>Unofficial PSU Docs</title>
	<meta
		name="description"
		content="Fan-made, improved reference pages for Phantasy Star Universe on the Clementine server."
	/>
</svelte:head>

<TopAppBar>
	{#snippet trailing()}
		<ThemeMenu />
		<IconButton icon={iconCode} label="Source on GitHub" tip="below-end" href={REPO_URL} target="_blank" rel="noopener" />
	{/snippet}
</TopAppBar>

<main class="home">
	<section class="hero">
		<div class="hero-text">
			<p class="eyebrow">Phantasy Star Universe · Clementine</p>
			<h1>Reference pages you can actually search</h1>
			<p class="lede">
				Fan-made, improved versions of selected pages from the PSU Clementine wiki: filters, item
				properties and pictures in one place. A few pages at a time.
			</p>
		</div>
	</section>

	<section class="pages" aria-labelledby="pages-title">
		<h2 id="pages-title">Pages</h2>
		<div class="grid">
			<article class="feature">
				<div class="feature-body">
					<p class="kicker">Drops · Items</p>
					<h3>Ultimate Drop Table</h3>
					<p class="text">
						Every Ultimate weapon, Line Shield and unit: where it drops, with its properties and picture.
						Filter by equipment, type, stars, planet and drop source.
					</p>
					<dl class="stats">
						<div><dt>Items</dt><dd>{stats.items}</dd></div>
						<div><dt>Sections</dt><dd>{stats.sections}</dd></div>
						<div><dt>Enemies</dt><dd>{stats.enemies}</dd></div>
						<div><dt>Missions</dt><dd>{stats.missions}</dd></div>
					</dl>
					<div class="actions">
						<Button variant="filled" size="m" iconType="left" href={resolve('/ultimate-drop-table')}>
							Open the table<Icon icon={iconArrow} />
						</Button>
						<Button
							variant="text"
							size="m"
							iconType="left"
							href="https://psu-clementine.com/wiki/Ultimate_Drop_Table"
							target="_blank"
							rel="noopener"
						>
							<Icon icon={iconOpen} />Wiki page
						</Button>
					</div>
					<p class="fineprint">Data exported from the wiki on {exported}.</p>
				</div>
				<ul class="feature-art" aria-label="What the table lists">
					<li class="weapons">
						<span class="shape" aria-hidden="true"><svg viewBox="0 0 380 380"><path d={pathSixSidedCookie} /></svg><Icon icon={iconMelee} size={28} /></span>
						<span class="figure"><strong>{stats.weapons}</strong> weapons</span>
					</li>
					<li class="shields">
						<span class="shape" aria-hidden="true"><svg viewBox="0 0 380 380"><path d={pathSoftBurst} /></svg><Icon icon={iconShield} size={24} /></span>
						<span class="figure"><strong>{stats.shields}</strong> Line Shields</span>
					</li>
					<li class="units">
						<span class="shape" aria-hidden="true"><svg viewBox="0 0 380 380"><path d={pathGem} /></svg><Icon icon={iconUnit} size={24} /></span>
						<span class="figure"><strong>{stats.units}</strong> units</span>
					</li>
				</ul>
			</article>

			<article class="soon">
				<ShapeIcon icon={iconIdea} shape={pathSixSidedCookie} size={56} tone="neutral" />
				<h3>More pages on the way</h3>
				<p class="text">This site improves a few wiki pages at a time. Is there one you would like next?</p>
				<Button variant="outlined" href={suggestUrl} target="_blank" rel="noopener">Suggest a page</Button>
			</article>
		</div>
	</section>
</main>

<style>
	.home {
		box-sizing: border-box;
		width: 100%;
		max-width: var(--page-max);
		margin: 0 auto;
		padding: 0 var(--page-gutter) 48px;
	}

	.hero {
		padding: 56px 0 40px;
	}

	.eyebrow {
		@apply --m3-label-large;
		margin: 0 0 12px;
		color: var(--m3c-primary);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h1 {
		@apply --m3-display-medium;
		max-width: 16ch;
		margin: 0;
		font-weight: 500;
		letter-spacing: -0.02em;
	}

	.lede {
		@apply --m3-body-large;
		max-width: 56ch;
		margin: 20px 0 0;
		color: var(--m3c-on-surface-variant);
		font-size: 1.125rem;
		line-height: 1.6;
	}

	h2 {
		@apply --m3-title-large;
		margin: 0 0 16px;
		color: var(--m3c-on-surface);
	}

	.grid {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
		gap: 16px;
	}

	.feature,
	.soon {
		border-radius: var(--m3-shape-extra-large);
		background-color: var(--app-pane);
	}

	.feature {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
	}

	/* The table's three kinds of items, each count on its own expressive shape. */
	.feature-art {
		display: grid;
		gap: 12px;
		margin: 0;
		padding: 32px 40px 32px 0;
		list-style: none;

		li {
			display: flex;
			align-items: center;
			gap: 16px;
		}
	}

	.shape {
		position: relative;
		display: grid;
		flex: none;
		place-items: center;
		width: 72px;
		height: 72px;

		svg {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
		}

		> :global(svg:last-child) {
			position: relative;
		}
	}

	.weapons .shape {
		color: var(--m3c-on-primary);
		fill: var(--m3c-primary);
	}

	.shields .shape {
		width: 64px;
		height: 64px;
		margin-left: 4px;
		color: var(--m3c-on-tertiary-container);
		fill: var(--m3c-tertiary-container);
	}

	.units .shape {
		width: 64px;
		height: 64px;
		margin-left: 4px;
		color: var(--m3c-on-secondary-container);
		fill: var(--m3c-secondary-container);
	}

	.figure {
		@apply --m3-body-large;
		color: var(--m3c-on-surface-variant);

		strong {
			@apply --m3-headline-small;
			display: block;
			font-weight: 500;
			color: var(--m3c-on-surface);
			font-variant-numeric: tabular-nums;
		}
	}

	.feature-body {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 32px;
	}

	.kicker {
		@apply --m3-label-large;
		margin: 0;
		color: var(--m3c-tertiary);
	}

	h3 {
		@apply --m3-headline-medium;
		margin: 0;
		font-weight: 500;
	}

	.text {
		@apply --m3-body-large;
		max-width: 60ch;
		margin: 0;
		color: var(--m3c-on-surface-variant);
	}

	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 8px 0;

		div {
			min-width: 96px;
			padding: 12px 16px;
			border-radius: var(--m3-shape-large);
			background-color: var(--app-well);
		}

		dt {
			@apply --m3-label-medium;
			color: var(--m3c-on-surface-variant);
		}

		dd {
			@apply --m3-headline-small;
			margin: 0;
			font-weight: 500;
			font-variant-numeric: tabular-nums;
		}
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 8px;
	}

	.fineprint {
		@apply --m3-body-small;
		margin: 4px 0 0;
		color: var(--m3c-on-surface-variant);
	}

	.soon {
		display: flex;
		flex-direction: column;
		align-self: start;
		align-items: flex-start;
		gap: 12px;
		padding: 32px;

		h3 {
			@apply --m3-title-large;
			margin-top: 8px;
		}

		.text {
			@apply --m3-body-medium;
			margin-bottom: 4px;
		}
	}

	@media (width < 1000px) {
		.hero {
			padding: 32px 0;
		}

		.grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	@media (width < 760px) {
		.feature {
			grid-template-columns: minmax(0, 1fr);
		}

		.feature-art {
			grid-template-columns: repeat(3, auto);
			justify-content: start;
			gap: 16px 24px;
			padding: 0 24px 28px;
			border-top: 1px solid var(--m3c-outline-variant);
			margin: 0 24px;
			padding: 20px 0 24px;
		}
	}

	@media (width < 600px) {
		.home {
			padding-bottom: 32px;
		}

		.feature-art {
			grid-template-columns: minmax(0, 1fr);
			margin: 0 20px;
		}

		h1 {
			@apply --m3-headline-large;
			font-weight: 500;
		}

		.feature-body,
		.soon {
			padding: 24px 20px;
		}

		.stats {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
