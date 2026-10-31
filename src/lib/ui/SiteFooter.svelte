<script lang="ts">
	import { resolve } from '$app/paths';
	import { REPO_URL, dropReportUrl } from '#lib/site.js';
	import Logo from './Logo.svelte';
</script>

<footer class="site-footer">
	<div class="inner">
		<div class="about">
			<p class="title"><Logo size={24} /> Unofficial PSU Docs</p>
			<p>
				Fan-made and unofficial. Not affiliated with SEGA or the Clementine team. Game data and item
				pictures come from the <a href="https://psu-clementine.com/wiki/">PSU Clementine wiki</a>.
			</p>
		</div>
		<nav aria-label="Footer">
			<ul>
				<li><a href={resolve('/')}>Home</a></li>
				<li><a href={resolve('/ultimate-drop-table')}>Ultimate Drop Table</a></li>
				<li><a href={REPO_URL} target="_blank" rel="noopener">Source on GitHub</a></li>
				<li><a href={dropReportUrl()} target="_blank" rel="noopener">Report a drop</a></li>
			</ul>
		</nav>
	</div>
</footer>

<style>
	.site-footer {
		box-sizing: border-box;
		width: 100%;
		max-width: var(--page-max);
		margin: auto auto 0;
		padding: 32px var(--page-gutter) 40px;
		color: var(--m3c-on-surface-variant);
	}

	.inner {
		display: flex;
		flex-wrap: wrap;
		gap: 24px 48px;
		justify-content: space-between;
		padding-top: 24px;
		border-top: 1px solid var(--m3c-outline-variant);
	}

	.about {
		max-width: 56ch;

		p {
			@apply --m3-body-medium;
			margin: 8px 0 0;
		}
	}

	.title {
		@apply --m3-title-small;
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0;
		color: var(--m3c-on-surface);
	}

	ul {
		@apply --m3-label-large;
		display: flex;
		flex-wrap: wrap;
		gap: 4px 24px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	a {
		color: var(--m3c-primary);
		text-underline-offset: 3px;
	}

	nav a {
		color: var(--m3c-on-surface-variant);
		text-decoration: none;

		&:hover {
			color: var(--m3c-primary);
			text-decoration: underline;
		}
	}
</style>
