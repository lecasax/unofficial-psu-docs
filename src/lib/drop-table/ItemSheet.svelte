<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { fade, fly, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import iconBack from '@ktibow/iconset-material-symbols/arrow-back-rounded';
	import iconClose from '@ktibow/iconset-material-symbols/close-rounded';
	import IconButton from '#lib/ui/IconButton.svelte';
	import ItemActions from './ItemActions.svelte';
	import ItemDetail from './ItemDetail.svelte';
	import type { Item, Planet } from './types.js';

	// An item's full details where there is no side panel: a modal dialog on medium screens,
	// a full-screen page on phones. It opens with focus on the item's name, at the top. Esc,
	// the back arrow, the close button and a click on the scrim all call `onclose`, which the
	// page wires to history.back(), so the phone's own Back closes it too.
	let {
		item,
		planets = [],
		onclose,
		onclosed
	}: {
		item: Item | null;
		planets?: Planet[];
		onclose: () => void;
		/** Called once the dialog is gone and the page can take focus again. */
		onclosed?: () => void;
	} = $props();

	let scroller = $state<HTMLDivElement>();
	let heading = $state<HTMLElement | null>(null);
	let titleShown = $state(false);
	const compact = () => matchMedia('(width < 600px)').matches;
	const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

	const modal: Attachment<HTMLDialogElement> = (dialog) => {
		dialog.showModal();
		heading = dialog.querySelector<HTMLElement>('#sheet-title');
		heading?.focus({ preventScroll: true });
		// The page stays inert while the closing animation plays; give focus back after it.
		return () => requestAnimationFrame(() => onclosed?.());
	};

	// The bar's title appears once the item's name has scrolled under it.
	$effect(() => {
		if (!scroller || !heading) return;
		const observer = new IntersectionObserver(([entry]) => (titleShown = !entry.isIntersecting), {
			root: scroller,
			threshold: 0
		});
		observer.observe(heading);
		return () => observer.disconnect();
	});

	$effect(() => {
		void item?.id;
		scroller?.scrollTo({ top: 0 });
	});

	function motion(node: Element) {
		if (reduced()) return { duration: 0 };
		if (compact()) return fly(node, { y: 32, duration: 260, easing: cubicOut });
		return scale(node, { start: 0.96, duration: 200, easing: cubicOut });
	}
</script>

{#if item}
	<dialog
		class="item-sheet"
		aria-labelledby="sheet-title"
		{@attach modal}
		oncancel={(e) => {
			e.preventDefault();
			onclose();
		}}
	>
		<!-- The scrim is a pointer shortcut; Esc and the close button do the same. -->
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="scrim" onclick={onclose} transition:fade={{ duration: reduced() ? 0 : 180 }}></div>
		<div class="frame" transition:motion>
			<header class="bar">
				<span class="back"><IconButton icon={iconBack} label="Back to the list" tip="none" onclick={onclose} /></span>
				<span class="bar-title" class:shown={titleShown} aria-hidden="true">{item.name}</span>
				<span class="close"><IconButton icon={iconClose} label="Close" tip="none" onclick={onclose} /></span>
			</header>
			<div class="scroll" bind:this={scroller}>
				<ItemDetail {item} variant="sheet" headingId="sheet-title" {planets} />
			</div>
			<footer class="bottom">
				<ItemActions {item} />
			</footer>
		</div>
	</dialog>
{/if}

<style>
	dialog {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: center;
		width: 100%;
		max-width: none;
		height: 100%;
		max-height: none;
		margin: 0;
		padding: 0;
		overflow: hidden;
		border: 0;
		background: transparent;
		color: var(--m3c-on-surface);

		&::backdrop {
			background: transparent;
		}
	}

	.scrim {
		position: absolute;
		inset: 0;
		background-color: color-mix(in srgb, var(--m3c-scrim) 40%, transparent);
	}

	.frame {
		--art-radius: 0;
		position: relative;
		display: flex;
		flex-direction: column;
		width: min(560px, calc(100% - 48px));
		max-height: 90dvh;
		overflow: hidden;
		border-radius: var(--m3-shape-extra-large);
		background-color: var(--m3c-surface-container-high);
		box-shadow: var(--m3-elevation-3);
		--tile: var(--m3c-surface-container-highest);
	}

	.bar {
		display: flex;
		flex: none;
		align-items: center;
		gap: 4px;
		height: 56px;
		padding: 0 8px;
	}

	.back {
		display: none;
	}

	.close {
		margin-left: auto;
	}

	.bar-title {
		@apply --m3-title-medium;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		opacity: 0;
		transition: opacity 120ms linear;
	}

	.bar-title.shown {
		opacity: 1;
	}

	.scroll {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.bottom {
		display: flex;
		flex: none;
		align-items: center;
		height: 72px;
		padding: 0 16px;
		border-top: 1px solid var(--m3c-outline-variant);
		background-color: var(--m3c-surface-container);
	}

	/* Phones: a full-screen page with a back arrow. */
	@media (width < 600px) {
		.frame {
			width: 100%;
			height: 100%;
			max-height: none;
			border-radius: 0;
			background-color: var(--app-pane);
			box-shadow: none;
			--tile: var(--m3c-surface-container);
		}

		.bar {
			height: 64px;
			padding: 0 8px 0 4px;
		}

		.back {
			display: contents;
		}

		.close {
			display: none;
		}

		.back :global(.icon-button) {
			width: 48px;
			height: 48px;
		}

		.bottom {
			padding-bottom: env(safe-area-inset-bottom);
		}
	}
</style>
