<script lang="ts">
	import { onMount } from 'svelte';
	import iconSystem from '@ktibow/iconset-material-symbols/contrast';
	import iconLight from '@ktibow/iconset-material-symbols/light-mode-outline-rounded';
	import iconDark from '@ktibow/iconset-material-symbols/dark-mode-outline-rounded';
	import MenuButton from './MenuButton.svelte';

	// Light, dark or the system setting. The choice is applied before paint by app.html.
	type Theme = 'system' | 'light' | 'dark';
	const KEY = 'psu-docs-theme';
	let theme = $state<Theme>('system');

	onMount(() => {
		const saved = document.documentElement.dataset.theme;
		if (saved === 'light' || saved === 'dark') theme = saved;
	});

	function apply(t: Theme) {
		const root = document.documentElement;
		if (t === 'system') delete root.dataset.theme;
		else root.dataset.theme = t;
		try {
			if (t === 'system') localStorage.removeItem(KEY);
			else localStorage.setItem(KEY, t);
		} catch {
			// Storage can be blocked; the theme still applies to this page.
		}
	}
</script>

<MenuButton
	variant="icon"
	label="Theme"
	align="end"
	bind:value={theme}
	onchange={apply}
	options={[
		{ value: 'system', label: 'System default', icon: iconSystem },
		{ value: 'light', label: 'Light', icon: iconLight },
		{ value: 'dark', label: 'Dark', icon: iconDark }
	]}
/>
