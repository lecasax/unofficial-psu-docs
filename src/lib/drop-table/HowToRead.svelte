<script lang="ts">
	import { Icon } from 'm3-svelte';
	import iconPlus from '@ktibow/iconset-material-symbols/award-star-outline-rounded';
	import iconDash from '@ktibow/iconset-material-symbols/remove-rounded';
	import iconLevel from '@ktibow/iconset-material-symbols/fitness-center-rounded';
	import iconNote from '@ktibow/iconset-material-symbols/help-outline-rounded';
	import iconPlanet from '@ktibow/iconset-material-symbols/planet-outline-rounded';
	import iconStar from '@ktibow/iconset-material-symbols/star-outline-rounded';
	import iconClasses from '@ktibow/iconset-material-symbols/groups-outline-rounded';
	import iconRate from '@ktibow/iconset-material-symbols/percent-rounded';
	import { sourceIcons } from './glyphs.js';
</script>

<ul class="guide">
	<li>
		<span class="icon"><Icon icon={iconPlus} size={20} /></span>
		<div>
			<p class="term">/U+ in a name</p>
			<p>
				An Ultimate+ weapon: an end-game weapon with extra bonuses, such as more PA damage or a stronger
				status effect. Besides the drops listed here, it can be made from its /U version with an
				awakening board.
			</p>
		</div>
	</li>
	<li>
		<span class="icon"><Icon icon={sourceIcons.enemy} size={20} /></span>
		<div>
			<p class="term">The three drop sources</p>
			<p>
				They are the wiki's three columns. <strong>Enemy drop</strong>: the enemy that drops it.
				<strong>Mission drop</strong>: the mission, always on Ultimate difficulty, with the box it comes
				from when the wiki lists one (such as Clear Box). <strong>Area drops</strong>: the kind of area
				where it drops.
			</p>
			<p class="legend">
				<span><Icon icon={sourceIcons.enemy} size={16} />Enemy</span>
				<span><Icon icon={sourceIcons.mission} size={16} />Mission</span>
				<span><Icon icon={sourceIcons.area} size={16} />Area</span>
			</p>
		</div>
	</li>
	<li>
		<span class="icon"><Icon icon={iconDash} size={20} /></span>
		<div>
			<p class="term">“No mission drop listed” and similar</p>
			<p>
				The wiki lists no drop of that kind for the item. A list shows at most three sources; the item's
				details show all of them.
			</p>
		</div>
	</li>
	<li>
		<span class="icon"><Icon icon={iconNote} size={20} /></span>
		<div>
			<p class="term">Global and RELICS</p>
			<p>
				"Global" comes from the wiki without an explanation. There are RELICS areas on every planet, and
				the wiki does not say which ones drop the item.
			</p>
		</div>
	</li>
	<li>
		<span class="icon"><Icon icon={iconPlanet} size={20} /></span>
		<div>
			<p class="term">Planet, and “planet not listed”</p>
			<p>
				Comes from the wiki's Missions, Enemies and Bosses pages. When those pages give no planet for a
				source, it reads “planet not listed”; nothing is guessed. A planet filter leaves such items out,
				unless you choose to include them.
			</p>
		</div>
	</li>
	<li>
		<span class="icon"><Icon icon={iconStar} size={20} /></span>
		<div>
			<p class="term">Stars and rank</p>
			<p>
				C is 1–3★, B 4–6★, A 7–9★ and S 10★ and up. Nearly every item here is S rank, so only the A-rank
				ones carry a small “A” tag.
			</p>
		</div>
	</li>
	<li>
		<span class="icon"><Icon icon={iconLevel} size={20} /></span>
		<div>
			<p class="term">Requirements</p>
			<p>
				Items have stat requirements (ATP, ATA, TP or DFP), not level requirements. When every item in a
				section needs the same stat, it is shown once, in the section's header.
			</p>
		</div>
	</li>
	<li>
		<span class="icon"><Icon icon={iconClasses} size={20} /></span>
		<div>
			<p class="term">Usable by</p>
			<p>Combines the weapon's own type list with the wiki's "Usable Weapons by Type" table.</p>
		</div>
	</li>
	<li>
		<span class="icon"><Icon icon={iconRate} size={20} /></span>
		<div>
			<p class="term">Drop rates</p>
			<p>Not shown: the wiki does not publish them.</p>
		</div>
	</li>
</ul>

<style>
	.guide {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		gap: 16px;
	}

	.icon {
		display: grid;
		flex: none;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: var(--m3-shape-full);
		background-color: var(--m3c-secondary-container);
		color: var(--m3c-on-secondary-container);
	}

	p {
		@apply --m3-body-medium;
		margin: 0;
		color: var(--m3c-on-surface-variant);
	}

	.term {
		@apply --m3-title-small;
		margin-bottom: 2px;
		color: var(--m3c-on-surface);
	}

	strong {
		font-weight: 500;
		color: var(--m3c-on-surface);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 16px;
		margin-top: 6px;

		span {
			display: inline-flex;
			align-items: center;
			gap: 4px;
		}
	}
</style>
