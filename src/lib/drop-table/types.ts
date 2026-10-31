// Shape of src/lib/drop-table/data.json, written by scripts/build-data.ts.

export type Rank = 'C' | 'B' | 'A' | 'S';
export type Planet = 'GUARDIANS Colony' | 'Parum' | 'Neudaiz' | 'Moatoob';
export type Category = 'weapon' | 'shield' | 'unit';

export interface MissionDrop {
	name: string;
	/** Box or table from the wiki's Drops data ("Clear Box", "Mid-Mission Box"...), when listed. */
	box: string | null;
}

export interface StatusEffect {
	name: string;
	level: number;
	/** Elements the weapon must have for this effect. */
	elements: string[];
}

export interface WeaponStats {
	manufacturer: string | null;
	/** Required ATP, ATA or TP. */
	requirement: { stat: 'ATP' | 'ATA' | 'TP'; value: number };
	/** "Attack" for melee and ranged weapons, "Tech." for technic weapons. */
	powerLabel: string;
	/** Attack (or Tech.) at grind 0 and at max grind. */
	power: [number, number];
	/** PP at grind 0 and at max grind; RCSMs have none. */
	pp: [number, number] | null;
	maxGrind: number;
	variance: number;
	accuracy: number | null;
	critMod: number | null;
	paMod: number;
	seMod: number | null;
	range: number | null;
	maxTargets: number;
	penetration: boolean | null;
	rcsm: { shotType: string | null; shotDelay: number } | null;
	elements: string[];
	status: StatusEffect[];
	/** Flat stat bonuses (ATP, DFP...), only the non-zero ones. */
	bonuses: Record<string, number>;
	races: string[];
	sexes: string[];
	description: string | null;
}

export interface ShieldStats {
	manufacturer: string | null;
	def: number;
	eva: number;
	ment: number;
	end: number;
	slots: { head: boolean; arm: boolean; body: boolean; extra: boolean };
	dfpRequired: number | null;
	element: string | null;
	comment: string | null;
}

export interface UnitEffect {
	text: string;
	/** true = improved, false = diminished, null = no arrow on the wiki. */
	up: boolean | null;
}

export interface UnitStats {
	slot: 'Head' | 'Arm' | 'Body' | 'Extra';
	manufacturer: string | null;
	/** Values as the wiki writes them; a few units have two ("475 / 500"). */
	stats: { label: string; value: string }[];
	effects: UnitEffect[];
	comment: string | null;
}

export interface Item {
	id: string;
	name: string;
	/** Section of the wiki table: "Swords", "Line Shields", "Head Units"... */
	group: string;
	/** Singular name of the kind of item: "Sword", "Line Shield", "Head unit"... */
	typeName: string;
	category: Category;
	style: 'melee' | 'ranged' | 'technic' | 'shield' | 'unit';
	stars: number | null;
	rank: Rank | null;
	/** Types (classes) that can equip it; null when unknown. */
	classes: string[] | null;
	planets: Planet[];
	enemies: string[];
	missions: MissionDrop[];
	areas: string[];
	wikiUrl: string | null;
	/**
	 * The wiki's picture of the item, loaded from the wiki, never copied here: the 300px
	 * thumbnail and the full file. Only weapons have one, and the file may still be missing,
	 * so show a fallback when it does not load.
	 */
	image: { thumb: string; full: string } | null;
	weapon: WeaponStats | null;
	shield: ShieldStats | null;
	unit: UnitStats | null;
}

export type EnemyKind =
	| 'Native creature'
	| 'Humanoid'
	| 'Machinery'
	| 'SEED-Form'
	| 'Stateria'
	| 'Rare enemy'
	| 'Event enemy'
	| 'Boss';

export interface Enemy {
	kinds: EnemyKind[];
	rare: boolean;
	planets: Planet[];
	/** Base enemy for element variants such as "Gol Dolva (Fire)". */
	element: string | null;
	wikiUrl: string | null;
}

export interface Mission {
	planet: Planet | null;
	wikiUrl: string | null;
}

export interface Area {
	planets: Planet[];
	note: string | null;
}

export interface DropTableData {
	meta: {
		/** Last edit of the wiki's Ultimate Drop Table page. */
		wikiEdited: string;
		/** Date the wiki data was exported. */
		exported: string;
		/**
		 * The wiki's weapon data was downloaded in full. A few drop table items may still
		 * have no properties, because the wiki has no data for them.
		 */
		weaponStatsComplete: boolean;
	};
	classes: string[];
	groups: { name: string; category: Category }[];
	items: Item[];
	enemies: Record<string, Enemy>;
	missions: Record<string, Mission>;
	areas: Record<string, Area>;
}
