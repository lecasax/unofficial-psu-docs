<script lang="ts">
	import { Card } from 'm3-svelte';
</script>

<svelte:head>
	<title>Unofficial PSU Docs</title>
</svelte:head>

<header>
	<div class="wrap">
		<p class="eyebrow">Phantasy Star Universe · Clementine</p>
		<h1>Unofficial PSU Docs</h1>
		<p class="lede">
			Improved, searchable versions of a few reference pages from the Clementine wiki.
		</p>
	</div>
</header>

<main class="wrap">
	<h2>Pages</h2>
	<ul class="cards">
		<li>
			<Card variant="filled">
				<div class="card-head">
					<h3>Ultimate Drop Table</h3>
					<span class="badge">In progress</span>
				</div>
				<p>
					Every Ultimate weapon and where it drops, browsable by weapon, enemy, mission or area.
				</p>
				<p class="source">
					Based on <a href="https://psu-clementine.com/wiki/Ultimate_Drop_Table">the wiki page</a>
				</p>
			</Card>
		</li>
	</ul>
</main>

<style>
	header {
		padding: 56px 0 40px;
		background-color: var(--m3c-surface-container-low);
	}

	.eyebrow {
		@apply --m3-label-large;
		margin: 0 0 8px;
		color: var(--m3c-primary);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h1 {
		@apply --m3-display-small;
		margin: 0;
	}

	.lede {
		margin: 12px 0 0;
		max-width: 60ch;
		color: var(--m3c-on-surface-variant);
	}

	h2 {
		@apply --m3-title-small;
		margin: 40px 0 16px;
		color: var(--m3c-on-surface-variant);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 16px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	h3 {
		@apply --m3-title-large;
		margin: 0;
	}

	p {
		margin: 8px 0 0;
		color: var(--m3c-on-surface-variant);
	}

	.badge {
		@apply --m3-label-medium;
		padding: 4px 12px;
		border-radius: var(--m3-shape-full);
		background-color: var(--m3c-tertiary-container);
		color: var(--m3c-on-tertiary-container);
		white-space: nowrap;
	}

	.source {
		@apply --m3-body-medium;
	}
</style>
