<script lang="ts">
	import { glyphs } from './glyphs.js';
</script>

<!-- One copy of each icon, shared by every list row through <use href="#g-name">. -->
<svg class="sprite" aria-hidden="true">
	{#each Object.entries(glyphs) as [name, icon] (name)}
		<symbol id="g-{name}" viewBox="0 0 {icon.width ?? 24} {icon.height ?? 24}">{@html icon.body}</symbol>
	{/each}
</svg>

<style>
	.sprite {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
	}
</style>
