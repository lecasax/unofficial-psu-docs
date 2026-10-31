<script lang="ts">
	import { Button, Chip, Icon } from 'm3-svelte';
	import iconClose from '@ktibow/iconset-material-symbols/close-rounded';
	import iconSort from '@ktibow/iconset-material-symbols/sort-rounded';
	import iconTune from '@ktibow/iconset-material-symbols/tune-rounded';
	import MenuButton from '#lib/ui/MenuButton.svelte';
	import { SORTS, SOURCE_KINDS, num, type SortKey } from './model.js';

	// Pinned over the results while they scroll: how many items show, the active filters as
	// removable chips, Clear all, the sort menu and, where the filter rail is hidden, the
	// button that opens the filters.
	let {
		sort = $bindable(),
		shown,
		total,
		active,
		chips,
		onclear,
		onfilters,
		element = $bindable()
	}: {
		sort: SortKey;
		shown: number;
		total: number;
		/** Number of active filters, for the Filters button's badge. */
		active: number;
		chips: { key: string; label: string; remove: () => void }[];
		onclear: () => void;
		onfilters: () => void;
		element?: HTMLElement;
	} = $props();
</script>

<div class="toolbar-sticky" bind:this={element}>
	<div class="toolbar">
		<div class="main">
			<span class="filters-open">
				<Button
					variant="tonal"
					iconType="left"
					onclick={onfilters}
					data-filter-open
					aria-label={active ? `Filters, ${active} active` : 'Filters'}
				>
					<Icon icon={iconTune} />Filters
					{#if active}<span class="badge" aria-hidden="true">{active}</span>{/if}
				</Button>
			</span>
			<p class="count" aria-live="polite" aria-atomic="true">
				{#if shown === total}
					{num(total)} items
				{:else}
					<strong>{num(shown)}</strong> of {num(total)} items
				{/if}
			</p>
			<p class="legend" aria-hidden="true">
				{#each SOURCE_KINDS as k (k.kind)}
					<span><svg><use href="#g-{k.kind}" /></svg>{k.label}</span>
				{/each}
			</p>
			<span class="sort">
				<MenuButton variant="chip" label="Sort by" icon={iconSort} align="end" active={sort !== 'wiki'} bind:value={sort} options={SORTS} />
			</span>
		</div>
		{#if chips.length}
			<div class="chips" role="group" aria-label="Active filters">
				{#each chips as c (c.key)}
					<Chip variant="input" trailingIcon={iconClose} onclick={c.remove} aria-label="Remove filter: {c.label}">
						{c.label}
					</Chip>
				{/each}
				<span class="clear">
					<Button variant="text" size="xs" onclick={onclear}>Clear all</Button>
				</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.toolbar-sticky {
		position: sticky;
		top: var(--app-bar-height);
		z-index: 3;
		container-type: scroll-state;
	}

	.toolbar {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 8px 8px 8px;
		border-bottom: 1px solid transparent;
		background-color: var(--list-bg, var(--app-pane));
	}

	@container scroll-state(stuck: top) {
		.toolbar {
			border-bottom-color: var(--m3c-outline-variant);
		}
	}

	.main {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 40px;
	}

	.filters-open {
		display: none;
	}

	.badge {
		@apply --m3-label-small;
		display: inline-grid;
		place-items: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		box-sizing: border-box;
		border-radius: var(--m3-shape-full);
		background-color: var(--m3c-primary);
		color: var(--m3c-on-primary);
		font-variant-numeric: tabular-nums;
	}

	.count {
		@apply --m3-title-small;
		margin: 0 0 0 8px;
		color: var(--m3c-on-surface-variant);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;

		strong {
			font-weight: 600;
			color: var(--m3c-on-surface);
		}
	}

	.legend {
		@apply --m3-label-small;
		display: flex;
		gap: 12px;
		margin: 0;
		color: var(--m3c-on-surface-variant);

		span {
			display: inline-flex;
			align-items: center;
			gap: 4px;
		}

		svg {
			width: 14px;
			height: 14px;
			fill: currentColor;
		}
	}

	.sort {
		margin-left: auto;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		padding: 0 0 2px 8px;
	}

	.clear {
		display: contents;
	}

	@container results (width < 620px) {
		.legend {
			display: none;
		}
	}

	/* The rail is hidden: a labelled button opens the filters. */
	@media (width < 1240px) {
		.filters-open {
			display: contents;
		}

		.count {
			margin-left: 0;
		}
	}

	/* Phones: the sort chip keeps its icon only; chips scroll sideways in one line. */
	@media (width < 600px) {
		.toolbar {
			padding: 8px 0;
		}

		.main {
			gap: 8px;
		}

		.sort :global(.value) {
			display: none;
		}

		.chips {
			flex-wrap: nowrap;
			margin: 0 -16px;
			padding: 2px 16px 4px;
			overflow-x: auto;
			scrollbar-width: none;

			> :global(*) {
				flex: none;
			}
		}
	}
</style>
