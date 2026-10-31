<script lang="ts">
	// The site mark, same drawing as static/favicon.svg.
	let { size = 32 }: { size?: number } = $props();
	const id = $props.id();
</script>

<svg class="logo" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
	<defs>
		<linearGradient id="{id}-bg" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#6fd3ff" />
			<stop offset="1" stop-color="#0a6f9e" />
		</linearGradient>
	</defs>
	<rect width="64" height="64" rx="18" fill="url(#{id}-bg)" />
	<path
		fill="#fff"
		d="M30 12c1.4 9.6 5.4 13.6 15 15-9.6 1.4-13.6 5.4-15 15-1.4-9.6-5.4-13.6-15-15 9.6-1.4 13.6-5.4 15-15Z"
	/>
	<path
		fill="#fff"
		fill-opacity=".75"
		d="M46 38c.7 4.6 2.4 6.3 7 7-4.6.7-6.3 2.4-7 7-.7-4.6-2.4-6.3-7-7 4.6-.7 6.3-2.4 7-7Z"
	/>
</svg>

<style>
	.logo {
		flex: none;
		display: block;
	}
</style>
