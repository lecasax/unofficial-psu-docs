<script lang="ts">
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<meta
		name="description"
		content="Fan-made, improved reference pages for Phantasy Star Universe on the Clementine server."
	/>
</svelte:head>

{@render children()}

<footer class="wrap">
	<p>
		Fan-made and unofficial. Not affiliated with SEGA or the Clementine team. Game data comes from
		the <a href="https://psu-clementine.com/wiki/">PSU Clementine wiki</a>.
	</p>
</footer>

<style>
	footer {
		@apply --m3-body-medium;
		margin-top: 56px;
		padding-top: 24px;
		padding-bottom: 40px;
		border-top: 1px solid var(--m3c-outline-variant);
		color: var(--m3c-on-surface-variant);
	}
</style>
