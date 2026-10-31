<script lang="ts">
	import { tick } from 'svelte';
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import ItemDetail from './ItemDetail.svelte';
	import type { Item } from './types.js';

	// A quick look for mouse users where there is no side panel: picture on top, then the key
	// properties. It is only a preview: hidden from assistive tech (the row's click opens the
	// full details in a dialog) and transparent to the pointer, so it can never catch the
	// mouse and stay open. Placed beside the item's name, never over it.
	let { item, anchor }: { item: Item; anchor: HTMLElement } = $props();

	const GAP = 12;
	const MARGIN = 12;
	let element = $state<HTMLDivElement>();
	let top = $state(0);
	let left = $state(0);
	let maxHeight = $state(0);
	let placed = $state(false);
	let tight = $state(false);
	const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

	async function place() {
		if (!element || !anchor.isConnected) return;
		const vh = window.innerHeight;
		const minTop = (parseFloat(getComputedStyle(element).getPropertyValue('--app-bar-height')) || 64) + 8;
		maxHeight = vh - minTop - MARGIN;
		// Drop the spec grid first when the card would not fit.
		tight = false;
		await tick();
		if (!element) return;
		if (element.scrollHeight > maxHeight) {
			tight = true;
			await tick();
			if (!element) return;
		}
		const a = anchor.getBoundingClientRect();
		const vw = document.documentElement.clientWidth;
		const w = element.offsetWidth;
		const h = Math.min(element.offsetHeight, maxHeight);
		let x = a.right + GAP;
		let y = a.top - 12;
		if (x + w > vw - MARGIN) x = a.left - GAP - w;
		if (x < MARGIN) {
			// No room beside the name: under it (or above), never over it.
			x = Math.min(Math.max(a.left, MARGIN), vw - w - MARGIN);
			y = a.bottom + GAP + h <= vh - MARGIN ? a.bottom + GAP : a.top - GAP - h;
		}
		left = x;
		top = Math.max(minTop, Math.min(y, vh - h - MARGIN));
		placed = true;
	}

	$effect(() => {
		void item;
		void anchor;
		requestAnimationFrame(place);
	});
</script>

<div
	bind:this={element}
	class="hover-card"
	class:placed
	class:tight
	aria-hidden="true"
	style:top="{top}px"
	style:left="{left}px"
	style:max-height={maxHeight ? `${maxHeight}px` : undefined}
	transition:scale={{ start: 0.96, opacity: 0, duration: reduced() ? 0 : 160, easing: cubicOut }}
>
	<ItemDetail {item} variant="card" />
</div>

<style>
	.hover-card {
		--art-radius: var(--m3-shape-large) var(--m3-shape-large) 0 0;
		--tile: light-dark(var(--m3c-surface-container-low), var(--m3c-surface-container-highest));
		position: fixed;
		z-index: 20;
		box-sizing: border-box;
		width: 344px;
		overflow: hidden;
		border-radius: var(--m3-shape-large);
		background-color: var(--app-raised);
		box-shadow: var(--m3-elevation-3);
		pointer-events: none;
		visibility: hidden;
		transform-origin: left top;
	}

	.placed {
		visibility: visible;
	}

	.tight :global(.specs) {
		display: none;
	}
</style>
