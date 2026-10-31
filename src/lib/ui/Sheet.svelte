<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	// Modal sheet on a native <dialog>: a side sheet from the start or end edge, and a
	// full-screen dialog on phones. Focus moves to [data-autofocus] (else the first control),
	// stays trapped inside, and returns to where it was on close.
	let {
		open = $bindable(false),
		side = 'start',
		surface = 'sheet',
		labelledby,
		children
	}: {
		open: boolean;
		side?: 'start' | 'end';
		/** pane: the color of the app's content panes, for content that is shown in one on desktop. */
		surface?: 'sheet' | 'pane';
		labelledby: string;
		children: Snippet;
	} = $props();

	const compact = () => matchMedia('(width < 600px)').matches;
	const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

	const modal: Attachment<HTMLDialogElement> = (dialog) => {
		const previous = document.activeElement as HTMLElement | null;
		dialog.showModal();
		dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true });
		return () => previous?.focus({ preventScroll: true });
	};

	function motion(node: Element) {
		if (reduced()) return { duration: 0 };
		if (compact()) return fly(node, { y: 48, duration: 280, easing: cubicOut });
		return fly(node, { x: side === 'start' ? -360 : 360, opacity: 1, duration: 320, easing: cubicOut });
	}
</script>

{#if open}
	<dialog
		class="app-sheet {side} {surface}"
		aria-labelledby={labelledby}
		{@attach modal}
		oncancel={(e) => {
			e.preventDefault();
			open = false;
		}}
		onclose={() => (open = false)}
	>
		<!-- The scrim is a pointer shortcut; Esc and the close button do the same. -->
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="scrim" onclick={() => (open = false)} transition:fade={{ duration: reduced() ? 0 : 200 }}></div>
		<div class="panel" transition:motion>
			{@render children()}
		</div>
	</dialog>
{/if}

<style>
	dialog {
		position: fixed;
		inset: 0;
		display: flex;
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

	.panel {
		position: relative;
		display: flex;
		flex-direction: column;
		width: min(400px, calc(100% - 56px));
		height: 100%;
		overflow: hidden;
		background-color: var(--m3c-surface-container-low);
		box-shadow: var(--m3-elevation-1);
	}

	.start .panel {
		border-radius: 0 var(--m3-shape-large) var(--m3-shape-large) 0;
	}

	.end .panel {
		margin-left: auto;
		border-radius: var(--m3-shape-large) 0 0 var(--m3-shape-large);
	}

	.pane .panel {
		background-color: var(--app-pane);
	}

	@media (width < 600px) {
		.panel,
		.start .panel,
		.end .panel {
			width: 100%;
			border-radius: 0;
		}

		.sheet .panel {
			background-color: var(--app-chrome);
		}
	}
</style>
