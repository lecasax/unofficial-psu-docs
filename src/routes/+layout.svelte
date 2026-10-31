<script lang="ts">
	import '../app.css';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

{@render children()}

<SiteFooter />
