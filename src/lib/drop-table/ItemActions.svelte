<script lang="ts">
	import { Button, Icon } from 'm3-svelte';
	import iconOpen from '@ktibow/iconset-material-symbols/open-in-new-rounded';
	import iconReport from '@ktibow/iconset-material-symbols/bug-report-outline-rounded';
	import { dropReportUrl } from '#lib/site.js';
	import type { Item } from './types.js';

	// The two things to do with an item: read its wiki page (when the wiki has one) and report
	// a drop for it (a GitHub issue with the item filled in).
	let { item }: { item: Item } = $props();
</script>

<div class="item-actions">
	{#if item.wikiUrl}
		<Button variant="tonal" iconType="left" href={item.wikiUrl} target="_blank" rel="noopener">
			<Icon icon={iconOpen} />Wiki page<span class="sr-only">{` of ${item.name} (opens in a new tab)`}</span>
		</Button>
	{/if}
	<Button variant="text" iconType="left" href={dropReportUrl(item.name)} target="_blank" rel="noopener">
		<Icon icon={iconReport} />Report a drop<span class="sr-only">{` for ${item.name} (opens in a new tab)`}</span>
	</Button>
</div>

<style>
	.item-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}
</style>
