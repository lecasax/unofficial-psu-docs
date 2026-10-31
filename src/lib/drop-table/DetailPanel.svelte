<script lang="ts">
	import ItemActions from './ItemActions.svelte';
	import ItemDetail from './ItemDetail.svelte';
	import type { Item, Planet } from './types.js';

	// The right-hand panel on wide screens: the item shown (by hover, click or keyboard focus),
	// scrolling on its own, with its actions in a footer that is always in reach. The panel is
	// never re-created when the item changes; it only scrolls back to the top.
	let { item, planets = [] }: { item: Item | null; planets?: Planet[] } = $props();

	let scroller = $state<HTMLDivElement>();
	let overflowing = $state(false);

	function measure() {
		if (!scroller) return;
		overflowing = scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 2;
	}

	$effect(() => {
		void item?.id;
		scroller?.scrollTo({ top: 0 });
		requestAnimationFrame(measure);
	});

	$effect(() => {
		if (!scroller) return;
		const observer = new ResizeObserver(measure);
		observer.observe(scroller);
		for (const child of scroller.children) observer.observe(child);
		return () => observer.disconnect();
	});
</script>

<aside class="detail-pane" aria-label="Item details">
	<div class="scroll" bind:this={scroller} onscroll={measure}>
		{#if item}
			<ItemDetail {item} variant="pane" headingId="pane-title" {planets} />
		{/if}
	</div>
	{#if item}
		<footer class="actions" class:fade={overflowing}>
			<ItemActions {item} />
		</footer>
	{/if}
</aside>

<style>
	.detail-pane {
		--art-radius: var(--m3-shape-extra-large) var(--m3-shape-extra-large) 0 0;
		position: sticky;
		top: calc(var(--app-bar-height) + 8px);
		display: flex;
		flex-direction: column;
		max-height: calc(100dvh - var(--app-bar-height) - 16px);
		overflow: hidden;
		border-radius: var(--m3-shape-extra-large);
		background-color: var(--app-pane);
	}

	.scroll {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
	}

	.actions {
		position: relative;
		display: flex;
		flex: none;
		align-items: center;
		height: 56px;
		padding: 0 16px;
		border-top: 1px solid var(--m3c-outline-variant);
		background-color: var(--app-pane);
	}

	/* A soft edge over the last lines while there is more to scroll. */
	.actions.fade::before {
		content: '';
		position: absolute;
		right: 0;
		bottom: calc(100% + 1px);
		left: 0;
		height: 24px;
		background: linear-gradient(transparent, var(--app-pane));
		pointer-events: none;
	}
</style>
