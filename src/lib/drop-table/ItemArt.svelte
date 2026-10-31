<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { pathSixSidedCookie, pathSoftBurst } from 'm3-svelte';
	import { Icon } from 'm3-svelte';
	import type { Item } from './types.js';
	import { styleIcons } from './glyphs.js';

	// The band at the top of an item's details: the wiki's picture (hotlinked, never copied), or
	// designed art for the item's category when there is no picture. The band keeps one height
	// for every item, so the content under it never jumps.
	//
	// Swapping items never blanks the band: the next picture loads off screen while the current
	// one stays, then fades in over it (two <img> slots that take turns, never re-created). A
	// load slower than 300 ms fades to the category art with a loading sweep meanwhile.
	let { item, size = 'panel', credit = 'link' }: { item: Item; size?: 'panel' | 'card'; credit?: 'link' | 'text' } =
		$props();

	type Picture = { thumb: string; full: string };
	type Slot = 'a' | 'b';
	let pictures = $state<Record<Slot, Picture | null>>({ a: null, b: null });
	/** The slot on top, fading in; null shows the art. */
	let front = $state<Slot | null>(null);
	/** The slot it replaces, kept opaque under it until the fade ends. */
	let behind = $state<Slot | null>(null);
	/** The item the art shows (the current one, once its picture is known to be missing or slow). */
	let artItem = $state(untrack(() => item));
	let missing = $state(false);
	let sweeping = $state(false);
	const images: Record<Slot, HTMLImageElement | undefined> = $state({ a: undefined, b: undefined });

	let token = 0;
	let settle: ReturnType<typeof setTimeout> | undefined;

	function showArt(of: Item, state: { missing?: boolean; sweeping?: boolean } = {}) {
		artItem = of;
		missing = state.missing ?? false;
		sweeping = state.sweeping ?? false;
		front = null;
		behind = null;
	}

	async function showPicture(t: number, picture: Picture) {
		const slot: Slot = untrack(() => front) === 'a' ? 'b' : 'a';
		pictures[slot] = picture;
		await tick();
		await images[slot]?.decode().catch(() => {});
		if (t !== token) return;
		behind = untrack(() => front);
		front = slot;
		sweeping = false;
		missing = false;
		clearTimeout(settle);
		settle = setTimeout(() => (behind = null), 160);
	}

	$effect(() => {
		const current = item;
		const t = ++token;
		untrack(() => {
			const image = current.image;
			if (!image) return showArt(current);
			if (front && pictures[front]?.thumb === image.thumb) return;
			const slow = setTimeout(() => t === token && showArt(current, { sweeping: true }), 300);
			const loader = new Image();
			loader.src = image.thumb;
			loader.decode().then(
				() => {
					clearTimeout(slow);
					if (t === token) showPicture(t, image);
				},
				() => {
					clearTimeout(slow);
					if (t === token) showArt(current, { missing: true });
				}
			);
		});
	});

	const art = $derived.by(() => {
		const i = artItem;
		if (i.category === 'unit') return { shape: pathSoftBurst, tag: `${i.unit?.slot ?? 'Unit'} unit`, slots: null };
		if (i.category === 'shield') {
			const s = i.shield?.slots;
			return { shape: pathSoftBurst, tag: 'Line Shield', slots: s ? [s.head, s.arm, s.body, s.extra] : null };
		}
		return { shape: pathSixSidedCookie, tag: null, slots: null };
	});
	const shown = $derived(front ? pictures[front] : null);
</script>

<figure class="art-band {size}">
	<div class="art {artItem.category}" class:sweeping aria-hidden="true">
		<span class="shape">
			<svg viewBox="0 0 380 380"><path d={art.shape} /></svg>
			<Icon icon={styleIcons[artItem.style]} size={size === 'card' ? 40 : 48} />
		</span>
		{#if art.tag}
			<span class="tag">
				{art.tag}
				{#if art.slots}
					<span class="dots">{#each art.slots as open, i (i)}<i class:open></i>{/each}</span>
				{/if}
			</span>
		{/if}
	</div>
	{#each ['a', 'b'] as const as slot (slot)}
		{@const picture = pictures[slot]}
		<div class="picture" class:front={front === slot} class:behind={behind === slot} aria-hidden={front !== slot}>
			{#if picture}
				<div class="ambient" style:background-image="url('{picture.thumb}')"></div>
				<img bind:this={images[slot]} src={picture.thumb} alt={front === slot ? item.name : ''} decoding="async" />
			{/if}
		</div>
	{/each}
	{#if missing}
		<figcaption class="caption">Picture unavailable on the wiki</figcaption>
	{:else if shown}
		{#if credit === 'link'}
			<a class="credit" href={shown.full} target="_blank" rel="noopener">
				Image: PSU Clementine wiki<span class="sr-only">{' (full size, opens in a new tab)'}</span>
			</a>
		{:else}
			<span class="credit" aria-hidden="true">Image: PSU Clementine wiki</span>
		{/if}
	{/if}
</figure>

<style>
	.art-band {
		--band: 200px;
		position: relative;
		height: var(--band);
		margin: 0;
		overflow: hidden;
		border-radius: var(--art-radius, 0);
		background-color: var(--m3c-surface-container-high);
		isolation: isolate;
	}

	.card {
		--band: 160px;
	}

	/* --- Designed art: a tonal field, an expressive shape and the category's glyph --- */

	.art {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding-bottom: 8px;
		box-sizing: border-box;
		--field: var(--m3c-secondary-container);
		--field-2: var(--m3c-primary-container-subtle);
		--ink: var(--m3c-on-secondary-container);
		--shape: var(--m3c-primary);
		--glyph: var(--m3c-on-primary);
		background:
			radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--shape) 18%, transparent), transparent 58%),
			linear-gradient(135deg, var(--field), var(--field-2));
		color: var(--ink);
	}

	.art.shield {
		--field: var(--m3c-tertiary-container-subtle);
		--field-2: color-mix(in srgb, var(--m3c-tertiary-container-subtle) 45%, var(--m3c-surface-container));
		--ink: var(--m3c-on-tertiary-container-subtle);
		--shape: var(--m3c-tertiary);
		--glyph: var(--m3c-on-tertiary);
	}

	.art.unit {
		--field: var(--m3c-secondary-container);
		--field-2: color-mix(in srgb, var(--m3c-secondary-container) 60%, var(--m3c-surface-container));
		--ink: var(--m3c-on-secondary-container);
		--shape: var(--m3c-secondary);
		--glyph: var(--m3c-on-secondary);
	}

	.shape {
		position: relative;
		display: grid;
		flex: none;
		place-items: center;
		width: 112px;
		height: 112px;
		color: var(--glyph);

		svg {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
			fill: var(--shape);
		}

		> :global(svg:last-child) {
			position: relative;
		}
	}

	.card .shape {
		width: 84px;
		height: 84px;
	}

	.tag {
		@apply --m3-label-large;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.dots {
		display: inline-flex;
		gap: 4px;

		i {
			width: 8px;
			height: 8px;
			box-sizing: border-box;
			border: 1.5px solid currentColor;
			border-radius: var(--m3-shape-full);
		}

		i.open {
			background-color: currentColor;
		}
	}

	/* Loading: a soft sweep over the art, only when a picture takes a while. */
	.sweeping::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			100deg,
			transparent 30%,
			color-mix(in srgb, var(--m3c-on-surface) 8%, transparent) 50%,
			transparent 70%
		);
		background-size: 250% 100%;
		animation: sweep 1.4s linear infinite;
	}

	@keyframes sweep {
		from {
			background-position: 100% 0;
		}
		to {
			background-position: -150% 0;
		}
	}

	/* --- The wiki's picture: natural size, centred on a blurred copy of itself --- */

	.picture {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		overflow: hidden;
		opacity: 0;
		transition: opacity 120ms linear;
	}

	.picture.behind {
		z-index: 1;
		opacity: 1;
		transition: none;
	}

	.picture.front {
		z-index: 2;
		opacity: 1;
	}

	.ambient {
		position: absolute;
		inset: 0;
		background-position: center;
		background-size: cover;
		filter: blur(28px) saturate(1.3);
		transform: scale(1.2);

		&::after {
			content: '';
			position: absolute;
			inset: 0;
			background-color: color-mix(in srgb, var(--m3c-surface-container-low) 50%, transparent);
		}
	}

	img {
		position: relative;
		display: block;
		width: auto;
		height: auto;
		max-width: calc(100% - 24px);
		max-height: calc(100% - 16px);
	}

	.credit,
	.caption {
		@apply --m3-label-small;
		position: absolute;
		z-index: 3;
	}

	/* Credit on the picture, in the inverse colors: legible on any image, in both themes. */
	.credit {
		right: 8px;
		bottom: 8px;
		padding: 2px 8px;
		border-radius: var(--m3-shape-full);
		background-color: color-mix(in srgb, var(--m3c-inverse-surface) 82%, transparent);
		color: var(--m3c-inverse-on-surface);
		text-decoration: none;
	}

	a.credit:hover {
		text-decoration: underline;
	}

	.caption {
		bottom: 10px;
		left: 0;
		right: 0;
		color: var(--m3c-on-secondary-container);
		text-align: center;
	}

	@media (prefers-reduced-motion: reduce) {
		.picture {
			transition: none;
		}
	}
</style>
