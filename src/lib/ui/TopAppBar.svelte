<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import Logo from './Logo.svelte';

	// MD3 small top app bar: brand on the leading side, an optional centered slot (search) and
	// trailing actions. Its container color steps up once the page scrolls under it.
	let { children, trailing }: { children?: Snippet; trailing?: Snippet } = $props();
	let scrollY = $state(0);
</script>

<svelte:window bind:scrollY />

<header class="top-app-bar" class:scrolled={scrollY > 4}>
	<div class="inner">
		<a class="brand" href={resolve('/')} aria-label="Unofficial PSU Docs, home">
			<Logo size={32} />
			<span class="wordmark" aria-hidden="true">
				<span class="name">Unofficial PSU Docs</span>
				<span class="tagline">Phantasy Star Universe · Clementine</span>
			</span>
		</a>
		<div class="center">{@render children?.()}</div>
		<div class="trailing">{@render trailing?.()}</div>
	</div>
</header>

<style>
	.top-app-bar {
		position: sticky;
		top: 0;
		z-index: 10;
		height: var(--app-bar-height);
		background-color: var(--app-chrome);
		transition: background-color var(--m3-easing);
	}

	.inner {
		display: flex;
		align-items: center;
		gap: 16px;
		box-sizing: border-box;
		max-width: var(--page-max);
		height: 100%;
		margin: 0 auto;
		padding: 0 calc(var(--page-gutter) - 4px) 0 var(--page-gutter);
	}

	.scrolled {
		background-color: var(--m3c-surface-container);
	}

	.brand {
		display: flex;
		flex: none;
		align-items: center;
		gap: 12px;
		height: 48px;
		padding: 0 12px 0 0;
		border-radius: var(--m3-shape-medium);
		color: var(--m3c-on-surface);
		text-decoration: none;

		&:hover .name {
			color: var(--m3c-primary);
		}
	}

	.wordmark {
		display: flex;
		flex-direction: column;
	}

	.name {
		@apply --m3-title-medium;
		line-height: 1.25rem;
		transition: color var(--m3-easing-fast);
	}

	.tagline {
		@apply --m3-label-small;
		color: var(--m3c-on-surface-variant);
	}

	.center {
		display: flex;
		flex: 1;
		justify-content: center;
		min-width: 0;
	}

	.trailing {
		display: flex;
		flex: none;
		align-items: center;
		gap: 4px;
	}

	@media (width < 1240px) {
		.tagline {
			display: none;
		}
	}

	@media (width < 840px) {
		.inner {
			gap: 8px;
			padding: 0 8px 0 var(--page-gutter);
		}

		.brand {
			padding: 0;
		}

		.wordmark {
			display: none;
		}
	}
</style>
