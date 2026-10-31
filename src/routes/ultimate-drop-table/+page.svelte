<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { MediaQuery } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button, ConnectedButtons, Dialog, Icon, pathSoftBurst } from 'm3-svelte';
	import iconSearch from '@ktibow/iconset-material-symbols/search-rounded';
	import iconClose from '@ktibow/iconset-material-symbols/close-rounded';
	import iconInfo from '@ktibow/iconset-material-symbols/info-outline-rounded';
	import iconReport from '@ktibow/iconset-material-symbols/bug-report-outline-rounded';
	import iconSearchOff from '@ktibow/iconset-material-symbols/search-off-rounded';
	import iconBook from '@ktibow/iconset-material-symbols/menu-book-outline-rounded';
	import iconEdit from '@ktibow/iconset-material-symbols/edit-outline-rounded';
	import iconDownload from '@ktibow/iconset-material-symbols/download-rounded';
	import iconChevron from '@ktibow/iconset-material-symbols/chevron-right-rounded';
	import IconButton from '#lib/ui/IconButton.svelte';
	import ShapeIcon from '#lib/ui/ShapeIcon.svelte';
	import Sheet from '#lib/ui/Sheet.svelte';
	import ThemeMenu from '#lib/ui/ThemeMenu.svelte';
	import TopAppBar from '#lib/ui/TopAppBar.svelte';
	import DetailPanel from '#lib/drop-table/DetailPanel.svelte';
	import FilterPanel from '#lib/drop-table/FilterPanel.svelte';
	import Glyphs from '#lib/drop-table/Glyphs.svelte';
	import HoverCard from '#lib/drop-table/HoverCard.svelte';
	import HowToRead from '#lib/drop-table/HowToRead.svelte';
	import ItemSheet from '#lib/drop-table/ItemSheet.svelte';
	import ResultNotes from '#lib/drop-table/ResultNotes.svelte';
	import ResultsList from '#lib/drop-table/ResultsList.svelte';
	import ResultsToolbar from '#lib/drop-table/ResultsToolbar.svelte';
	import { hoverIntent } from '#lib/drop-table/hover-intent.js';
	import type { Item, Planet } from '#lib/drop-table/types.js';
	import {
		PLANETS,
		QUICK_EQUIPMENT,
		SORTS,
		SOURCE_KINDS,
		activeCount,
		byId,
		classes,
		data,
		emptyFilters,
		equipmentLabel,
		evaluate,
		formatDate,
		items,
		num,
		plural,
		sortedGroups,
		type Facet,
		type Filters,
		type SortKey,
		type SourceKey
	} from '#lib/drop-table/model.js';
	import { dropReportUrl } from '#lib/site.js';

	const WIKI_PAGE = 'https://psu-clementine.com/wiki/Ultimate_Drop_Table';

	// --- Layout: the side panel from 840 px (MD3 expanded), the filter rail from 1240 px ---

	const showPane = new MediaQuery('(min-width: 840px)', true);
	const showRail = new MediaQuery('(min-width: 1240px)', true);
	const fineHover = new MediaQuery('(hover: hover) and (pointer: fine)', false);
	const phone = new MediaQuery('(max-width: 599px)', false);

	// --- Filters and results ---

	let filters = $state(emptyFilters());
	let queryInput = $state('');
	let sort = $state<SortKey>('wiki');
	const result = $derived(evaluate(filters));
	const groups = $derived(sortedGroups(sort));
	const visible = $derived(new Set(result.visible.map((i) => i.id)));
	const order = $derived(groups.flatMap((g) => g.items.filter((i) => visible.has(i.id))));
	const active = $derived(activeCount(filters));

	// The list follows the search field after a short pause, so typing stays smooth and the
	// result count is announced once. Clearing the field applies at once.
	let queryTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const q = queryInput;
		clearTimeout(queryTimer);
		if (q === untrack(() => filters.query)) return;
		if (q.trim() === '') filters.query = q;
		else queryTimer = setTimeout(() => (filters.query = q), 120);
	});

	function setQuery(text: string) {
		queryInput = text;
		filters.query = text;
	}

	function clearFilters(search = false) {
		filters = { ...emptyFilters(), query: search ? '' : filters.query };
		if (search) queryInput = '';
	}

	const chips = $derived.by(() => {
		const f = filters;
		const list: { key: string; label: string; remove: () => void }[] = [];
		if (f.equipment !== 'all')
			list.push({ key: 'equipment', label: equipmentLabel(f.equipment), remove: () => (f.equipment = 'all') });
		if (f.cls !== 'any') list.push({ key: 'cls', label: f.cls, remove: () => (f.cls = 'any') });
		for (const s of f.stars)
			list.push({ key: `stars-${s}`, label: `${s}★`, remove: () => (f.stars = f.stars.filter((x) => x !== s)) });
		for (const p of f.planets)
			list.push({ key: p, label: p, remove: () => (f.planets = f.planets.filter((x) => x !== p)) });
		if (f.unlisted && f.planets.length)
			list.push({ key: 'unlisted', label: 'Planet not listed', remove: () => (f.unlisted = false) });
		for (const s of f.sources) {
			const label = `${SOURCE_KINDS.find((k) => k.key === s)?.label} drops`;
			list.push({ key: s, label, remove: () => (f.sources = f.sources.filter((x) => x !== s)) });
		}
		if (f.race !== 'any') list.push({ key: 'race', label: f.race, remove: () => (f.race = 'any') });
		return list;
	});

	// The filter that empties the list, and what removing it would show.
	const FACET_NAMES: Record<Facet, (f: Filters) => string> = {
		query: (f) => `the search “${f.query.trim()}”`,
		equipment: (f) => `Equipment: ${equipmentLabel(f.equipment)}`,
		cls: (f) => `Type: ${f.cls}`,
		stars: (f) => `Stars: ${f.stars.map((s) => `${s}★`).join(', ')}`,
		planets: (f) => `Planet: ${f.planets.join(', ')}`,
		sources: (f) => `Drops from: ${f.sources.map((s) => SOURCE_KINDS.find((k) => k.key === s)?.label).join(', ')}`,
		race: (f) => `Race: ${f.race}`
	};
	const isSet = (f: Filters, facet: Facet) =>
		facet === 'query'
			? f.query.trim() !== ''
			: facet === 'equipment'
				? f.equipment !== 'all'
				: facet === 'cls' || facet === 'race'
					? f[facet] !== 'any'
					: f[facet].length > 0;
	// The search says what the person wants, so a filter is offered for removal first.
	const blocker = $derived.by(() => {
		if (result.visible.length) return null;
		const ranked = (Object.keys(FACET_NAMES) as Facet[])
			.filter((k) => isSet(filters, k))
			.map((facet) => ({ facet, count: result.relaxed[facet] ?? 0 }))
			.filter((c) => c.count > 0)
			.sort((a, b) => Number(a.facet === 'query') - Number(b.facet === 'query') || b.count - a.count);
		const best = ranked[0];
		return best ? { ...best, name: FACET_NAMES[best.facet](filters) } : null;
	});
	function removeFacet(facet: Facet) {
		if (facet === 'query') return setQuery('');
		Object.assign(filters, { [facet]: emptyFilters()[facet] });
	}

	// --- The item shown: one state for hover, click and keyboard focus ---

	let activeId = $state(items[0].id);
	const shownItem = $derived((visible.has(activeId) ? byId.get(activeId) : order[0]) ?? null);
	// If the shown item leaves the results, the first visible item takes over.
	$effect(() => {
		const first = order[0];
		if (first && !visible.has(untrack(() => activeId))) activeId = first.id;
	});

	let focusId = $state<string | null>(null);
	const tabId = $derived(focusId && visible.has(focusId) ? focusId : (shownItem?.id ?? null));

	// --- Details where there is no panel: a dialog (600–839 px) or a full-screen page ---
	// Opened as a shallow history entry, so the browser's or phone's Back closes it.

	const openId = $derived((page.state as App.PageState).item ?? null);
	const openItem = $derived(openId && !showPane.current ? (byId.get(openId) ?? null) : null);
	let returnTo: string | null = null;

	function openDetails(item: Item) {
		returnTo = item.id;
		goto('', { shallow: true, state: { item: item.id } });
	}
	const closeDetails = () => history.back();

	/** The dialog or page is gone: focus goes back to the row it was opened from. */
	function detailsClosed() {
		if (!returnTo || openItem) return;
		document.getElementById(`opt-${returnTo}`)?.focus({ preventScroll: true });
		returnTo = null;
	}

	// Growing past 840 px with details open: the panel takes the item over.
	$effect(() => {
		if (showPane.current && untrack(() => openId)) {
			activeId = untrack(() => openId)!;
			returnTo = null;
			history.back();
		}
	});

	// --- Hover: the panel follows a resting pointer; without a panel, a quick-look card ---

	let card = $state<{ item: Item; anchor: HTMLElement } | null>(null);
	let intent: ReturnType<typeof hoverIntent> | undefined;
	const hideCard = () => {
		card = null;
		intent?.reset();
	};

	const listIntent: Attachment<HTMLElement> = (list) => {
		intent = hoverIntent(list, {
			selector: '[data-item-trigger]',
			onRest(row) {
				const item = row.dataset.id ? byId.get(row.dataset.id) : undefined;
				if (!item) return;
				if (showPane.current) activeId = item.id;
				else if (fineHover.current) card = { item, anchor: row.querySelector<HTMLElement>('.who-text') ?? row };
			},
			onLeave() {
				card = null;
			}
		});
		return () => intent?.destroy();
	};

	$effect(() => {
		if (showPane.current || !fineHover.current) card = null;
	});

	function choose(item: Item, keyboard: boolean) {
		hideCard();
		if (showPane.current) {
			activeId = item.id;
			// Enter or Space: go to the details, at the top.
			if (keyboard) tick().then(() => document.getElementById('pane-title')?.focus());
		} else {
			openDetails(item);
		}
	}

	function focusRow(item: Item) {
		focusId = item.id;
		if (showPane.current) activeId = item.id;
	}

	// --- Keyboard shortcuts: / to search, Esc to leave the panel ---

	let searchInput = $state<HTMLInputElement>();
	function onWindowKey(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		const typing = target.closest('input, textarea, select, [contenteditable="true"]');
		if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !document.querySelector('dialog[open]')) {
			e.preventDefault();
			searchInput?.focus();
		} else if (e.key === 'Escape') {
			hideCard();
			if (shownItem && target.closest('.detail-pane')) document.getElementById(`opt-${shownItem.id}`)?.focus();
		}
	}

	// --- Sheets and dialogs ---

	let filtersOpen = $state(false);
	let guideOpen = $state(false);
	$effect(() => {
		if (showRail.current) filtersOpen = false;
	});

	// Closing the filter sheet after changing filters shows the new results from their start.
	let filtersBefore = '';
	$effect(() => {
		const open = filtersOpen;
		const now = untrack(() => JSON.stringify({ ...filters, query: '' }));
		if (open) {
			filtersBefore = now;
		} else if (filtersBefore && filtersBefore !== now) {
			filtersBefore = '';
			tick().then(() => {
				// The notes come first: they explain what a planet or type filter leaves out.
				const start = document.querySelector<HTMLElement>('.notes') ?? document.getElementById('results');
				if (!start || !toolbar) return;
				const appBar = parseFloat(getComputedStyle(start).getPropertyValue('--app-bar-height')) || 64;
				const target = start.getBoundingClientRect().top + scrollY - appBar - toolbar.offsetHeight - 8;
				if (scrollY > target) window.scrollTo({ top: target });
			});
		}
	});

	// The toolbar's height, for the section headers pinned under it.
	let toolbar = $state<HTMLElement>();
	let toolbarHeight = $state(57);
	$effect(() => {
		if (!toolbar) return;
		const observer = new ResizeObserver(() => (toolbarHeight = toolbar!.offsetHeight));
		observer.observe(toolbar);
		return () => observer.disconnect();
	});

	// --- The view in the address bar: shareable and kept on reload ---

	const KEY = 'psu-docs-type';
	let restored = false;
	/** The last type picked here (kept in this browser), offered first in the Type menu. */
	let lastType = $state<string | null>(null);
	onMount(() => {
		const q = page.url.searchParams;
		const f = emptyFilters();
		const list = (name: string) => q.get(name)?.split(',').filter(Boolean) ?? [];
		f.query = q.get('q') ?? '';
		const equipment = q.get('equipment');
		if (equipment && equipmentLabel(equipment) !== equipment) f.equipment = equipment;
		const cls = q.get('type');
		if (cls && classes.includes(cls)) f.cls = cls;
		try {
			const saved = localStorage.getItem(KEY);
			if (saved && classes.includes(saved)) lastType = saved;
		} catch {
			// Storage can be blocked; the menu simply has no last-used type.
		}
		f.stars = list('stars').map(Number).filter((s) => items.some((i) => i.stars === s));
		f.planets = list('planet').filter((p): p is Planet => PLANETS.includes(p as Planet));
		f.unlisted = q.get('unlisted') === '1';
		f.sources = list('from').filter((s): s is SourceKey => SOURCE_KINDS.some((k) => k.key === s));
		filters = f;
		queryInput = f.query;
		const s = q.get('sort');
		if (s && SORTS.some((o) => o.value === s)) sort = s as SortKey;
		const item = q.get('item');
		if (item && byId.has(item)) {
			activeId = item;
			if (!showPane.current) tick().then(() => openDetails(byId.get(item)!));
		}
		restored = true;
	});

	let urlTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const f = filters;
		const params = new URLSearchParams();
		if (f.query.trim()) params.set('q', f.query.trim());
		if (f.equipment !== 'all') params.set('equipment', f.equipment);
		if (f.cls !== 'any') params.set('type', f.cls);
		if (f.stars.length) params.set('stars', f.stars.join(','));
		if (f.planets.length) params.set('planet', f.planets.join(','));
		if (f.unlisted && f.planets.length) params.set('unlisted', '1');
		if (f.sources.length) params.set('from', f.sources.join(','));
		if (sort !== 'wiki') params.set('sort', sort);
		const item = showPane.current ? activeId : openId;
		if (item && (showPane.current ? item !== order[0]?.id : true)) params.set('item', item);
		const cls = f.cls;
		clearTimeout(urlTimer);
		urlTimer = setTimeout(() => {
			if (!restored) return;
			if (cls !== 'any') {
				lastType = cls;
				try {
					localStorage.setItem(KEY, cls);
				} catch {
					// Storage can be blocked; the address bar still keeps the view.
				}
			}
			const search = params.toString();
			const url = `${page.url.pathname}${search ? `?${search}` : ''}${page.url.hash}`;
			if (url !== `${location.pathname}${location.search}${location.hash}`)
				goto(url, { replace: true, shallow: true, state: page.state }).catch(() => {});
		}, 400);
	});
</script>

<svelte:head>
	<title>Ultimate Drop Table · Unofficial PSU Docs</title>
	<meta
		name="description"
		content="Where every Ultimate weapon, Line Shield and unit drops in PSU Clementine, with item properties and filters by equipment, type, stars and planet."
	/>
</svelte:head>

<svelte:window onkeydown={onWindowKey} onscrollcapture={() => card && hideCard()} />

<Glyphs />

<a
	class="skip-link"
	href="#results"
	onclick={(e) => {
		const row = tabId && document.getElementById(`opt-${tabId}`);
		if (row) {
			e.preventDefault();
			row.focus();
		}
	}}
>
	Skip to the item list
</a>

<TopAppBar>
	<search class="search-bar">
		<Icon icon={iconSearch} size={24} />
		<input
			bind:this={searchInput}
			bind:value={queryInput}
			type="search"
			placeholder={phone.current ? 'Search the table' : 'Search items, enemies, missions, areas'}
			aria-label="Search items, enemies, missions and areas"
			aria-controls="results"
			autocomplete="off"
			spellcheck="false"
		/>
		{#if queryInput}
			<IconButton
				icon={iconClose}
				label="Clear search"
				tip="none"
				onclick={() => {
					setQuery('');
					searchInput?.focus();
				}}
			/>
		{:else}
			<kbd class="shortcut" title="Press / to search">/</kbd>
		{/if}
	</search>
	{#snippet trailing()}
		<ThemeMenu />
		<IconButton icon={iconReport} label="Report a drop" tip="below-end" href={dropReportUrl()} target="_blank" rel="noopener" />
	{/snippet}
</TopAppBar>

<div class="layout dt-page">
	<aside class="filter-pane" aria-labelledby="filters-title">
		<div class="panel-head">
			<h2 id="filters-title">Filters</h2>
			{#if active}
				<Button variant="text" size="xs" onclick={() => clearFilters()}>Clear all</Button>
			{/if}
		</div>
		{#if showRail.current}
			<FilterPanel bind:filters counts={result.counts} recentType={lastType} />
		{/if}
	</aside>

	<main class="list-pane" style:--toolbar-h="{toolbarHeight}px">
		<header class="page-head">
			<nav class="crumbs" aria-label="Breadcrumb">
				<a href={resolve('/')}>Home</a>
				<Icon icon={iconChevron} size={18} />
				<span aria-current="page">Ultimate Drop Table</span>
			</nav>
			<h1>Ultimate Drop Table</h1>
			<p class="lede">
				Where every Ultimate weapon, Line Shield and unit drops, and what each one does.
				<span class="for-panel">Rest the pointer on an item to see it on the right.</span>
				<span class="for-mouse">Point at an item for a quick look; click it for every detail.</span>
				<span class="for-touch">Tap an item for its picture, properties and drops.</span>
			</p>
			<ul class="facts">
				<li>
					<Icon icon={iconBook} size={18} />
					<span>Source: <a href={WIKI_PAGE} target="_blank" rel="noopener">PSU Clementine wiki</a></span>
				</li>
				<li><Icon icon={iconEdit} size={18} /><span>Edited {formatDate(data.meta.wikiEdited)}</span></li>
				<li><Icon icon={iconDownload} size={18} /><span>Exported {formatDate(data.meta.exported)}</span></li>
			</ul>
			<div class="head-actions">
				<span class="guide-tonal">
					<Button variant="tonal" iconType="left" onclick={() => (guideOpen = true)}>
						<Icon icon={iconInfo} />How to read this table
					</Button>
				</span>
				<span class="guide-text">
					<Button variant="text" iconType="left" onclick={() => (guideOpen = true)}>
						<Icon icon={iconInfo} />How to read this table
					</Button>
				</span>
			</div>
		</header>

		<div class="quick" role="radiogroup" aria-label="Show">
			<ConnectedButtons>
				{#each QUICK_EQUIPMENT as q (q.value)}
					<Button variant="filled" label>
						<input
							type="radio"
							name="quick-equipment"
							value={q.value}
							checked={filters.equipment === q.value}
							onchange={() => (filters.equipment = q.value)}
						/>
						<span class="quick-label">{q.label}</span><span class="quick-short">{q.short}</span>
						<span class="quick-count">{num(result.counts.equipment[q.value] ?? 0)}</span>
					</Button>
				{/each}
			</ConnectedButtons>
		</div>

		<ResultsToolbar
			bind:element={toolbar}
			bind:sort
			shown={result.visible.length}
			total={items.length}
			{active}
			{chips}
			onclear={() => clearFilters()}
			onfilters={() => (filtersOpen = true)}
		/>

		<div class="notes">
			<ResultNotes bind:filters {result} onquery={setQuery} />
		</div>

		{#if result.visible.length === 0}
			<div class="empty">
				<ShapeIcon icon={iconSearchOff} shape={pathSoftBurst} size={88} />
				<h2>No items match</h2>
				{#if blocker}
					<p>Without {blocker.name}, {plural(blocker.count, 'item')} would show.</p>
					<div class="empty-actions">
						<Button variant="filled" onclick={() => removeFacet(blocker.facet)}>Remove {blocker.name}</Button>
						{#if active > 0 && filters.query.trim()}
							<Button variant="text" onclick={() => clearFilters(true)}>Clear search and filters</Button>
						{:else if active > 1}
							<Button variant="text" onclick={() => clearFilters()}>Clear all filters</Button>
						{/if}
					</div>
				{:else}
					<p>Try fewer filters, or search for an enemy, mission or area name.</p>
					<Button variant="tonal" onclick={() => clearFilters(true)}>Clear search and filters</Button>
				{/if}
			</div>
		{/if}

		<ResultsList
			{groups}
			{visible}
			{order}
			selectedId={showPane.current ? (shownItem?.id ?? null) : openId}
			openId={openItem?.id ?? null}
			{tabId}
			hint={showPane.current
				? 'Up and down arrows move between items; the panel follows.'
				: 'Up and down arrows move between items; Enter opens the details.'}
			query={filters.query}
			planets={filters.planets}
			covered={filtersOpen && phone.current}
			attach={listIntent}
			onchoose={choose}
			onfocusrow={focusRow}
			onblurlist={() => (focusId = null)}
		/>
	</main>

	<div class="detail-column">
		{#if showPane.current}
			<DetailPanel item={shownItem} planets={filters.planets} />
		{/if}
	</div>
</div>

{#if card}
	<HoverCard item={card.item} anchor={card.anchor} />
{/if}

<Sheet bind:open={filtersOpen} side="start" labelledby="filters-sheet-title">
	<div class="sheet-bar">
		<IconButton icon={iconClose} label="Close filters" tip="none" onclick={() => (filtersOpen = false)} />
		<h2 id="filters-sheet-title" tabindex="-1" data-autofocus>Filters</h2>
		{#if active}
			<Button variant="text" size="xs" onclick={() => clearFilters()}>Clear all</Button>
		{/if}
	</div>
	<div class="sheet-scroll">
		<FilterPanel bind:filters counts={result.counts} recentType={lastType} />
	</div>
	<div class="sheet-actions">
		<Button variant="filled" onclick={() => (filtersOpen = false)}>
			Show {plural(result.visible.length, 'item')}
		</Button>
	</div>
</Sheet>

<ItemSheet item={openItem} planets={filters.planets} onclose={closeDetails} onclosed={detailsClosed} />

<Dialog headline="How to read this table" bind:open={guideOpen} role="dialog" aria-label="How to read this table">
	<HowToRead />
	{#snippet buttons()}
		<Button variant="text">Got it</Button>
	{/snippet}
</Dialog>

<style>
	/* The table page is a wide, dense workspace. */
	:global(:root:has(.dt-page)) {
		--page-max: 1840px;
		--page-gutter: 16px;
	}

	.skip-link {
		@apply --m3-label-large;
		position: fixed;
		clip-path: inset(50%);
		top: 12px;
		left: 12px;
		z-index: 40;
		padding: 10px 16px;
		border-radius: var(--m3-shape-full);
		background-color: var(--m3c-inverse-surface);
		color: var(--m3c-inverse-on-surface);
		text-decoration: none;
		translate: 0 -200%;

		&:focus-visible {
			clip-path: none;
			translate: 0 0;
		}
	}

	/* --- App bar search --- */

	.search-bar {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		max-width: 720px;
		height: 48px;
		padding: 0 4px 0 16px;
		box-sizing: border-box;
		border-radius: var(--m3-shape-full);
		background-color: var(--m3c-surface-container-high);
		color: var(--m3c-on-surface-variant);
		transition: background-color var(--m3-easing-fast);

		&:hover {
			background-color: var(--m3c-surface-container-highest);
		}

		&:focus-within {
			background-color: var(--app-raised);
			box-shadow: var(--m3-elevation-2);
		}

		input {
			@apply --m3-body-large;
			flex: 1;
			min-width: 0;
			height: 100%;
			padding: 0;
			border: 0;
			outline: none;
			background: transparent;
			color: var(--m3c-on-surface);
			animation: none;

			&::placeholder {
				color: var(--m3c-on-surface-variant);
			}

			&::-webkit-search-cancel-button {
				appearance: none;
			}
		}
	}

	.shortcut {
		@apply --m3-label-medium;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		margin-right: 8px;
		border: 1px solid var(--m3c-outline);
		border-radius: var(--m3-shape-extra-small);
		color: var(--m3c-on-surface-variant);
	}

	/* --- Layout: rail, list and panel --- */

	.layout {
		display: grid;
		grid-template-columns: 280px minmax(0, 1fr) clamp(360px, 30vw, 440px);
		gap: 16px;
		align-items: start;
		box-sizing: border-box;
		width: 100%;
		max-width: var(--page-max);
		margin: 0 auto;
		padding: 8px var(--page-gutter) 0;
	}

	.filter-pane {
		position: sticky;
		top: calc(var(--app-bar-height) + 8px);
		max-height: calc(100dvh - var(--app-bar-height) - 16px);
		padding-bottom: 24px;
		box-sizing: border-box;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		mask-image: linear-gradient(#000 calc(100% - 24px), transparent);
	}

	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 40px;
		padding: 0 4px 0 16px;

		h2 {
			@apply --m3-title-large;
			margin: 0;
		}
	}

	.list-pane {
		--list-bg: var(--app-pane);
		min-width: 0;
		padding: 0 8px 16px;
		border-radius: var(--m3-shape-extra-large);
		background-color: var(--app-pane);
		container: results / inline-size;
	}

	.detail-column {
		align-self: stretch;
	}

	/* --- Page header --- */

	.page-head {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 20px 16px 16px;
	}

	.crumbs {
		@apply --m3-label-large;
		display: flex;
		align-items: center;
		gap: 4px;
		color: var(--m3c-on-surface-variant);

		a {
			color: var(--m3c-primary);
			text-decoration: none;
			border-radius: var(--m3-shape-extra-small);

			&:hover {
				text-decoration: underline;
				text-underline-offset: 3px;
			}
		}
	}

	h1 {
		@apply --m3-headline-large;
		margin: 0;
		font-weight: 500;
		letter-spacing: -0.01em;
	}

	.lede {
		@apply --m3-body-large;
		max-width: 66ch;
		margin: 0;
		color: var(--m3c-on-surface-variant);
	}

	/* The hint matches how the page is used: a panel, a mouse without panel, or touch. */
	.for-panel,
	.for-mouse,
	.for-touch {
		display: none;
	}

	@media (width >= 840px) and (not (pointer: coarse)) {
		.for-panel {
			display: inline;
		}
	}

	@media (width < 840px) and (not (pointer: coarse)) {
		.for-mouse {
			display: inline;
		}
	}

	@media (pointer: coarse) {
		.for-touch {
			display: inline;
		}
	}

	.facts {
		@apply --m3-body-small;
		display: flex;
		flex-wrap: wrap;
		gap: 4px 20px;
		margin: 0;
		padding: 0;
		list-style: none;
		color: var(--m3c-on-surface-variant);

		li {
			display: inline-flex;
			align-items: center;
			gap: 6px;
		}

		a {
			color: var(--m3c-primary);
			text-underline-offset: 2px;
		}
	}

	.head-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 2px;
	}

	.guide-text {
		display: none;
	}

	/* --- Quick filter: one equipment category at a time --- */

	.quick {
		display: none;
		padding: 4px 8px 8px;

		:global(.m3-container) {
			max-width: 560px;
		}

		:global(label) {
			gap: 6px;
		}

		:global(label:has(> input:focus-visible)) {
			outline: 3px solid var(--m3c-secondary);
			outline-offset: 2px;
		}
	}

	.quick-short {
		display: none;
	}

	.quick-count {
		@apply --m3-label-medium;
		opacity: 0.8;
		font-variant-numeric: tabular-nums;
	}

	.notes {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 8px;

		&:empty {
			display: none;
		}
	}

	/* --- Empty state --- */

	.empty {
		display: grid;
		justify-items: center;
		gap: 8px;
		padding: 56px 24px 64px;
		text-align: center;

		h2 {
			@apply --m3-title-large;
			margin: 8px 0 0;
		}

		p {
			@apply --m3-body-medium;
			max-width: 48ch;
			margin: 0 0 12px;
			color: var(--m3c-on-surface-variant);
		}
	}

	.empty-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
	}

	/* --- Sheets --- */

	.sheet-bar {
		display: flex;
		flex: none;
		align-items: center;
		gap: 8px;
		height: 64px;
		padding: 0 12px 0 8px;

		h2 {
			@apply --m3-title-large;
			flex: 1;
			margin: 0;
			outline: none;
		}
	}

	.sheet-scroll {
		flex: 1;
		min-height: 0;
		padding: 0 12px 16px;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.sheet-actions {
		display: flex;
		flex: none;
		justify-content: flex-end;
		padding: 12px 16px 16px;
		border-top: 1px solid var(--m3c-outline-variant);
	}

	/* --- Medium: the filters move into a sheet --- */

	@media (width < 1240px) {
		.layout {
			grid-template-columns: minmax(0, 1fr) 360px;
		}

		.filter-pane {
			display: none;
		}

		.quick {
			display: block;
		}
	}

	/* --- Compact: one column, items as cards, details in a dialog or a page --- */

	@media (width < 840px) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
			padding: 0;
		}

		.detail-column {
			display: none;
		}

		.list-pane {
			--list-bg: var(--app-chrome);
			padding: 0 var(--page-gutter) 16px;
			border-radius: 0;
			background: transparent;
		}

		.page-head {
			padding: 16px 0 12px;
		}

		.quick {
			padding: 0 0 8px;
		}

		.notes :global(.note) {
			margin: 0;
		}

		.shortcut {
			display: none;
		}

		.list-pane :global(.rows) {
			gap: 8px;
		}

		.list-pane :global(.row) {
			background-color: var(--app-pane);
		}

		.list-pane :global(.group-head) {
			padding-left: 0;
		}
	}

	/* --- Phones --- */

	@media (width < 600px) {
		.crumbs {
			display: none;
		}

		h1 {
			@apply --m3-headline-medium;
			font-weight: 500;
		}

		.lede {
			@apply --m3-body-medium;
		}

		.facts {
			gap: 2px 16px;
		}

		.guide-tonal {
			display: none;
		}

		.guide-text {
			display: contents;
		}

		.head-actions {
			margin: -4px 0 -4px -12px;
		}

		.quick-label,
		.quick-count {
			display: none;
		}

		.quick-short {
			display: inline;
		}
	}
</style>
