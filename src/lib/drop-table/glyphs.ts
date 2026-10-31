// Icons by kind of item and kind of drop source. Generic Material Symbols: the game's own
// item pictures only appear on demand (hover card and details), loaded from the wiki.
import iconMelee from '@ktibow/iconset-material-symbols/swords-rounded';
import iconRanged from '@ktibow/iconset-material-symbols/target';
import iconTechnic from '@ktibow/iconset-material-symbols/wand-stars-rounded';
import iconShield from '@ktibow/iconset-material-symbols/shield-rounded';
import iconUnit from '@ktibow/iconset-material-symbols/memory-rounded';
import iconEnemy from '@ktibow/iconset-material-symbols/skull-outline';
import iconMission from '@ktibow/iconset-material-symbols/flag-outline-rounded';
import iconArea from '@ktibow/iconset-material-symbols/map-outline-rounded';
import iconAll from '@ktibow/iconset-material-symbols/category-rounded';
import iconNote from '@ktibow/iconset-material-symbols/help-outline-rounded';
import iconChevron from '@ktibow/iconset-material-symbols/chevron-right-rounded';
import type { IconData } from '#lib/ui/types.js';
import type { SourceKind, Style } from './model.js';

export const styleIcons: Record<Style, IconData> = {
	melee: iconMelee,
	ranged: iconRanged,
	technic: iconTechnic,
	shield: iconShield,
	unit: iconUnit
};

export const sourceIcons: Record<SourceKind, IconData> = {
	enemy: iconEnemy,
	mission: iconMission,
	area: iconArea
};

/** Symbols for <Glyphs />: used as <svg><use href="#g-{name}" /></svg>. */
export const glyphs: Record<string, IconData> = {
	...styleIcons,
	...sourceIcons,
	all: iconAll,
	note: iconNote,
	chevron: iconChevron
};
