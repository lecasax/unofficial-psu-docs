// Presentation helpers for the Ultimate Drop Table: labels, drop sources, filters and counts.
// Everything here is computed from data.json; nothing is UI state.
import rawData from '#lib/drop-table/data.json';
import type { Category, DropTableData, Item, Planet, Rank } from './types.js';

export const data = rawData as DropTableData;
export const { items, classes } = data;
export const byId = new Map(items.map((i) => [i.id, i]));

export const PLANETS: Planet[] = ['GUARDIANS Colony', 'Parum', 'Neudaiz', 'Moatoob'];
export const RACES = ['Human', 'Newman', 'CAST', 'Beast'];
export const ELEMENTS = ['Neutral', 'Fire', 'Ice', 'Lightning', 'Ground', 'Light', 'Dark'];
const RANKS: Rank[] = ['C', 'B', 'A', 'S'];

/** The wiki's Types page groups the 16 types in three tiers. */
export const TIERS = ['Basic Types', 'Expert Types', 'Master Types'] as const;
export type Tier = (typeof TIERS)[number];
const TIER_OF: Record<string, Tier> = {
	Hunter: 'Basic Types',
	Ranger: 'Basic Types',
	Force: 'Basic Types',
	Fighmaster: 'Master Types',
	Gunmaster: 'Master Types',
	Masterforce: 'Master Types',
	Acromaster: 'Master Types'
};
export const tierOf = (cls: string): Tier => TIER_OF[cls] ?? 'Expert Types';

export type Style = Item['style'];
export type SourceKey = 'enemies' | 'missions' | 'areas';
export type SourceKind = 'enemy' | 'mission' | 'area';
export const SOURCE_KINDS: { key: SourceKey; kind: SourceKind; label: string; column: string }[] = [
	{ key: 'enemies', kind: 'enemy', label: 'Enemy', column: 'Enemy drop' },
	{ key: 'missions', kind: 'mission', label: 'Mission', column: 'Mission drop' },
	{ key: 'areas', kind: 'area', label: 'Area', column: 'Area drops' }
];

export const hasProperties = (item: Item) => Boolean(item.weapon || item.shield || item.unit);
/** A race filter only makes sense once some weapon is limited to fewer than four races. */
export const raceLimited = items.some((i) => i.weapon && i.weapon.races.length < RACES.length);

// --- Formatting ---

export const formatDate = (iso: string) =>
	new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'UTC' });
/** Thousands separators and a real minus sign. */
export const num = (v: number) => v.toLocaleString('en-US').replace('-', '−');
export const signed = (v: number) => (v > 0 ? `+${num(v)}` : num(v));
export const mod = (v: number) => `×${v.toFixed(2)}`;
export const minus = (text: string) => text.replace(/-(?=\d)/g, '−');
export const missionName = (name: string) => name.replace(/\s*\(Ultimate\)$/, '');
export const areaName = (name: string) => (name === 'Global' ? 'Global' : `${name} areas`);
export const plural = (n: number, one: string, many = `${one}s`) => `${num(n)} ${n === 1 ? one : many}`;
/** "a, b and c". */
export const listing = (list: string[]) =>
	list.length < 2 ? (list[0] ?? '') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
/** A unit's stat as the wiki writes it ("475 / 500"), each number signed. */
export const signedValue = (value: string) =>
	value
		.split('/')
		.map((v) => {
			const n = Number(v.trim());
			return Number.isFinite(n) ? signed(n) : minus(v.trim());
		})
		.join(' / ');

/** Short form of a weapon's possible elements. */
export function elementSummary(list: string[]) {
	const missing = ELEMENTS.filter((e) => !list.includes(e));
	if (missing.length === 0) return `All ${ELEMENTS.length} elements`;
	if (missing.length <= 2) return `All but ${listing(missing)}`;
	return listing(list);
}

/** "Sword · Yohmei" */
export const overline = (item: Item) => {
	const maker = item.weapon?.manufacturer ?? item.shield?.manufacturer ?? item.unit?.manufacturer;
	return maker ? `${item.typeName} · ${maker}` : item.typeName;
};

/** "15★ · S rank", or null without data. */
export const grade = (item: Item) =>
	item.stars ? `${item.stars}★${item.rank ? ` · ${item.rank} rank` : ''}` : item.rank ? `${item.rank} rank` : null;

// --- Drop sources ---

export interface Source {
	kind: SourceKind;
	name: string;
	href: string | null;
	/** Planets the wiki lists for the source; empty when it lists none. */
	planets: Planet[];
	/** "Neudaiz", "Every planet"; null when the wiki lists no planet. */
	planet: string | null;
	rare: boolean;
	boss: boolean;
	box: string | null;
	note: string | null;
}

const planetLabel = (list: Planet[]) =>
	list.length === 0 ? null : list.length === PLANETS.length ? 'Every planet' : list.join(', ');

function sourcesOf(item: Item): Source[] {
	const base = { href: null, rare: false, boss: false, box: null, note: null };
	return [
		...item.enemies.map((name): Source => {
			const e = data.enemies[name];
			const planets = e?.planets ?? [];
			return {
				...base,
				kind: 'enemy',
				name,
				href: e?.wikiUrl ?? null,
				planets,
				planet: planetLabel(planets),
				rare: Boolean(e?.rare),
				boss: Boolean(e?.kinds.includes('Boss'))
			};
		}),
		...item.missions.map((m): Source => {
			const info = data.missions[m.name];
			const planets = info?.planet ? [info.planet] : [];
			return {
				...base,
				kind: 'mission',
				name: missionName(m.name),
				href: info?.wikiUrl ?? null,
				planets,
				planet: planetLabel(planets),
				box: m.box
			};
		}),
		...item.areas.map((a): Source => {
			const info = data.areas[a];
			const planets = info?.planets ?? [];
			return { ...base, kind: 'area', name: areaName(a), planets, planet: planetLabel(planets), note: info?.note ?? null };
		})
	];
}

export const sources = new Map(items.map((i) => [i.id, sourcesOf(i)]));
/** Items with a drop source whose planet the wiki does not list. */
const unlistedPlanet = new Set(items.filter((i) => sources.get(i.id)!.some((s) => s.planets.length === 0)).map((i) => i.id));

/** "No mission or area drop listed" for the kinds an item does not drop from. */
export function missingKinds(list: Source[]) {
	const missing = SOURCE_KINDS.filter((k) => !list.some((s) => s.kind === k.kind)).map((k) => k.label.toLowerCase());
	if (missing.length === 0 || missing.length === SOURCE_KINDS.length) return null;
	return `No ${missing.join(' or ')} drop listed`;
}

// --- Equipment ---

export interface EquipmentOption {
	value: string;
	label: string;
	children?: EquipmentOption[];
}

const groupsOf = (category: Category) =>
	data.groups.filter((g) => g.category === category).map((g) => ({ value: `group:${g.name}`, label: g.name }));

export const EQUIPMENT: EquipmentOption[] = [
	{ value: 'all', label: 'All equipment' },
	{ value: 'cat:weapon', label: 'Weapons', children: groupsOf('weapon') },
	{ value: 'cat:shield', label: 'Line Shields' },
	{ value: 'cat:unit', label: 'Units', children: groupsOf('unit') }
];

/** The segmented quick filter: one equipment category each. */
export const QUICK_EQUIPMENT = [
	{ value: 'all', label: 'All', short: 'All' },
	{ value: 'cat:weapon', label: 'Weapons', short: 'Weapons' },
	{ value: 'cat:shield', label: 'Line Shields', short: 'Shields' },
	{ value: 'cat:unit', label: 'Units', short: 'Units' }
];

export const equipmentLabel = (value: string) =>
	EQUIPMENT.flatMap((o) => [o, ...(o.children ?? [])]).find((o) => o.value === value)?.label ?? value;

/** Style of the items in each wiki section, for its icon. */
export const groupStyle = new Map(data.groups.map((g) => [g.name, items.find((i) => i.group === g.name)?.style ?? 'melee']));

/**
 * The stat requirement every item of a section shares ("Requires 1,600 ATP"), or null when
 * they differ (RCSMs) or the section has none (units). Rows show it only when it is not shared.
 */
function requirementOf(item: Item) {
	if (item.weapon) return `Requires ${num(item.weapon.requirement.value)} ${item.weapon.requirement.stat}`;
	if (item.shield?.dfpRequired) return `Requires ${num(item.shield.dfpRequired)} DFP`;
	return null;
}
export const groupRequirement = new Map(
	data.groups.map((g) => {
		const reqs = new Set(items.filter((i) => i.group === g.name && hasProperties(i)).map(requirementOf));
		const only = reqs.size === 1 ? [...reqs][0] : null;
		return [g.name, only];
	})
);

// --- Stars ---

export const STAR_VALUES = [...new Set(items.map((i) => i.stars).filter((s) => s !== null))].sort((a, b) => b - a);
export const rankOfStars = (stars: number) => items.find((i) => i.stars === stars && i.rank)?.rank ?? null;

// --- Row summary ---

export interface RowMeta {
	stars: number | null;
	/** "A" for the A-rank rows; S is the norm and gets no chip. */
	rankChip: Rank | null;
	parts: string[];
}

const commonRank = (() => {
	const count = new Map<Rank, number>();
	for (const i of items) if (i.rank) count.set(i.rank, (count.get(i.rank) ?? 0) + 1);
	return [...count].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
})();

function statusShort(status: { name: string; level: number }[]) {
	if (status.length === 0) return null;
	if (status.length === 1) return `${status[0].name} Lv ${status[0].level}`;
	if (status.length === 2 && status[0].level === status[1].level)
		return `${status[0].name} or ${status[1].name} Lv ${status[0].level}`;
	return null;
}

export function rowMeta(item: Item): RowMeta {
	const parts: string[] = [];
	const shared = groupRequirement.get(item.group);
	if (item.weapon) {
		const w = item.weapon;
		parts.push(`${w.powerLabel} ${num(w.power[1])}`, `PA ${mod(w.paMod)}`);
		const status = statusShort(w.status);
		if (status) parts.push(status);
		if (!shared) parts.push(requirementOf(item)!);
	} else if (item.shield) {
		parts.push(`DFP ${num(item.shield.def)}`, `EVP ${num(item.shield.eva)}`);
		if (!shared && item.shield.dfpRequired) parts.push(requirementOf(item)!);
	} else if (item.unit) {
		const changes = item.unit.stats.filter((s) => !/^0(\s*\/\s*0)?$/.test(s.value.trim()));
		parts.push(...(changes.length ? changes.map((s) => `${signedValue(s.value)} ${s.label}`) : ['No stat change']));
	} else {
		parts.push('No data on the wiki');
	}
	return { stars: item.stars, rankChip: item.rank && item.rank !== commonRank ? item.rank : null, parts };
}

/** Short accessible name of a row: "Aoryu/U+, 15 stars, S rank, Sword". */
export function rowLabel(item: Item) {
	const bits = [item.name];
	if (item.stars) bits.push(`${item.stars} stars`);
	if (item.rank) bits.push(`${item.rank} rank`);
	bits.push(item.typeName);
	if (!hasProperties(item)) bits.push('no data on the wiki');
	return bits.join(', ');
}

// --- Types (classes) ---

export interface ClassProfile {
	cls: string;
	tier: Tier;
	/** Weapons this type can use, by rank. */
	byRank: Partial<Record<Rank, number>>;
	weapons: number;
	shields: number;
	units: number;
	/** Weapon sections where the type can use at least one weapon. */
	groups: string[];
	/** A-rank weapons in those sections that the type cannot use. */
	excludedA: { count: number; groups: string[] };
	/** Every usable weapon is S rank. */
	onlyS: boolean;
	/** The lowest weapon rank in this table, with its stars. */
	lowest: { rank: Rank; stars: number } | null;
	/** Items with no type data (left out by the Type filter). */
	unknown: number;
	/** Every Line Shield and unit here fits every type. */
	gearFitsAll: boolean;
}

const weaponsWithRank = items.filter((i) => i.category === 'weapon' && i.rank);
const lowestWeapon = weaponsWithRank.reduce<Item | null>(
	(low, i) => (!low || RANKS.indexOf(i.rank!) < RANKS.indexOf(low.rank!) ? i : low),
	null
);
const gearFitsAll = items
	.filter((i) => i.category !== 'weapon')
	.every((i) => i.classes !== null && classes.every((c) => i.classes!.includes(c)));

function computeProfile(cls: string): ClassProfile {
	const usable = items.filter((i) => i.classes?.includes(cls));
	const weapons = usable.filter((i) => i.category === 'weapon');
	const byRank: Partial<Record<Rank, number>> = {};
	for (const w of weapons) if (w.rank) byRank[w.rank] = (byRank[w.rank] ?? 0) + 1;
	const groups = [...new Set(weapons.map((w) => w.group))];
	const excluded = items.filter(
		(i) => i.category === 'weapon' && groups.includes(i.group) && i.rank === 'A' && !i.classes?.includes(cls)
	);
	return {
		cls,
		tier: tierOf(cls),
		byRank,
		weapons: weapons.length,
		shields: usable.filter((i) => i.category === 'shield').length,
		units: usable.filter((i) => i.category === 'unit').length,
		groups,
		excludedA: { count: excluded.length, groups: [...new Set(excluded.map((i) => i.group))] },
		onlyS: weapons.length > 0 && weapons.every((w) => w.rank === 'S'),
		lowest: lowestWeapon ? { rank: lowestWeapon.rank!, stars: lowestWeapon.stars ?? 0 } : null,
		unknown: items.filter((i) => i.classes === null).length,
		gearFitsAll
	};
}

const profiles = new Map(classes.map((c) => [c, computeProfile(c)]));
export const classProfile = (cls: string) => profiles.get(cls) ?? computeProfile(cls);
/** Items the Type and Stars filters cannot place, because the wiki has no data for them. */
export const unknownItems = items.filter((i) => i.classes === null || i.stars === null).length;

/** One line for the Type menu: what a type can use here, when it is not the usual mix. */
export function classSupport(cls: string) {
	const p = classProfile(cls);
	if (p.weapons === 0) return 'Line Shields and units only';
	if (p.onlyS) return 'S-rank weapons only';
	return null;
}

// --- Filters ---

export interface Filters {
	query: string;
	equipment: string;
	cls: string;
	stars: number[];
	planets: Planet[];
	/** With a planet filter: also show items with a source whose planet the wiki does not list. */
	unlisted: boolean;
	sources: SourceKey[];
	race: string;
}
export type Facet = Exclude<keyof Filters, 'unlisted'>;

export const emptyFilters = (): Filters => ({
	query: '',
	equipment: 'all',
	cls: 'any',
	stars: [],
	planets: [],
	unlisted: false,
	sources: [],
	race: 'any'
});

/** Number of active filters, search not included (it has its own field). */
export const activeCount = (f: Filters) =>
	Number(f.equipment !== 'all') +
	Number(f.cls !== 'any') +
	Number(f.race !== 'any') +
	Number(f.unlisted && f.planets.length > 0) +
	f.stars.length +
	f.planets.length +
	f.sources.length;

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+]/g, '');
const haystacks = new Map(
	items.map((i) => {
		const w = i.weapon;
		const words = [
			i.name,
			i.group,
			i.typeName,
			w?.manufacturer ?? i.shield?.manufacturer ?? i.unit?.manufacturer ?? '',
			...(w?.status.map((s) => s.name) ?? []),
			...i.enemies,
			...i.missions.map((m) => m.name),
			...i.areas,
			...sources.get(i.id)!.flatMap((s) => s.planets)
		];
		// Words stay apart, so a search never matches across two of them.
		return [i.id, words.map(norm).join('|')];
	})
);

const matchesPlanet = (i: Item, f: Filters) => f.planets.some((p) => i.planets.includes(p));

function predicates(f: Filters): Record<Facet, (item: Item) => boolean> {
	const words = f.query.split(/\s+/).map(norm).filter(Boolean);
	return {
		query: (i) => words.every((w) => haystacks.get(i.id)!.includes(w)),
		equipment: (i) =>
			f.equipment === 'all' ||
			(f.equipment.startsWith('cat:') ? i.category === f.equipment.slice(4) : i.group === f.equipment.slice(6)),
		cls: (i) => f.cls === 'any' || Boolean(i.classes?.includes(f.cls)),
		stars: (i) => f.stars.length === 0 || (i.stars !== null && f.stars.includes(i.stars)),
		planets: (i) => f.planets.length === 0 || matchesPlanet(i, f) || (f.unlisted && unlistedPlanet.has(i.id)),
		sources: (i) => f.sources.length === 0 || f.sources.some((s) => i[s].length > 0),
		race: (i) => f.race === 'any' || Boolean(i.weapon?.races.includes(f.race))
	};
}

/** Splits text around the searched words, to mark them (best effort: plain substrings). */
export function highlight(text: string, query: string): { text: string; match: boolean }[] {
	const words = query
		.toLowerCase()
		.split(/\s+/)
		.map((w) => w.replace(/[^a-z0-9+]/g, ''))
		.filter(Boolean);
	const lower = text.toLowerCase();
	const marked: boolean[] = new Array(text.length).fill(false);
	for (const w of words) {
		for (let i = lower.indexOf(w); i !== -1; i = lower.indexOf(w, i + w.length)) marked.fill(true, i, i + w.length);
	}
	const parts: { text: string; match: boolean }[] = [];
	let start = 0;
	for (let i = 1; i <= text.length; i++) {
		if (i === text.length || marked[i] !== marked[start]) {
			parts.push({ text: text.slice(start, i), match: marked[start] });
			start = i;
		}
	}
	return parts;
}

const bump = (counts: Record<string, number>, key: string) => (counts[key] = (counts[key] ?? 0) + 1);

/**
 * The items that pass every filter, plus faceted counts: each option counts the items that
 * would match if it were picked, with the other filters as they are.
 */
export function evaluate(f: Filters) {
	const tests = predicates(f);
	const facets = Object.keys(tests) as Facet[];
	const results = items.map((item) => ({ item, failed: facets.filter((k) => !tests[k](item)) }));
	const visible = results.filter((r) => r.failed.length === 0).map((r) => r.item);
	const without = (facet: Facet) =>
		results.filter((r) => r.failed.length === 0 || (r.failed.length === 1 && r.failed[0] === facet)).map((r) => r.item);

	const equipment: Record<string, number> = {};
	const equipmentBase = without('equipment');
	equipment.all = equipmentBase.length;
	for (const i of equipmentBase) {
		bump(equipment, `cat:${i.category}`);
		bump(equipment, `group:${i.group}`);
	}

	const cls: Record<string, number> = {};
	const clsBase = without('cls');
	cls.any = clsBase.length;
	for (const i of clsBase) for (const c of i.classes ?? []) bump(cls, c);

	const stars: Record<string, number> = {};
	for (const i of without('stars')) if (i.stars !== null) bump(stars, String(i.stars));

	const planets: Record<string, number> = {};
	const planetBase = without('planets');
	for (const i of planetBase) for (const p of i.planets) bump(planets, p);

	const sourceCounts: Record<string, number> = {};
	for (const i of without('sources')) for (const s of SOURCE_KINDS) if (i[s.key].length) bump(sourceCounts, s.key);

	const race: Record<string, number> = {};
	const raceBase = without('race');
	race.any = raceBase.length;
	for (const i of raceBase) for (const r of i.weapon?.races ?? []) bump(race, r);

	/** How many items each active filter is holding back: the results without it. */
	const relaxed: Partial<Record<Facet, number>> = {};
	for (const facet of facets) relaxed[facet] = without(facet).length;

	/** Items left out only because the Type or Stars filter needs data the wiki does not have. */
	const unknown = new Set([
		...(f.cls === 'any' ? [] : clsBase.filter((i) => i.classes === null)),
		...(f.stars.length === 0 ? [] : without('stars').filter((i) => i.stars === null))
	]).size;

	return {
		visible,
		counts: { equipment, cls, stars, planets, sources: sourceCounts, race },
		relaxed,
		unknown,
		/**
		 * With a planet filter: items that pass the other filters, are not on the chosen planets,
		 * and have a source whose planet the wiki does not list.
		 */
		unlisted:
			f.planets.length === 0 ? 0 : planetBase.filter((i) => !matchesPlanet(i, f) && unlistedPlanet.has(i.id)).length
	};
}
export type Counts = ReturnType<typeof evaluate>['counts'];

// --- Sorting ---

export type SortKey = 'wiki' | 'name' | 'power' | 'pa';
export const SORTS: { value: SortKey; label: string }[] = [
	{ value: 'wiki', label: 'Wiki order' },
	{ value: 'name', label: 'Name (A–Z)' },
	{ value: 'power', label: 'Attack or Tech. at +10' },
	{ value: 'pa', label: 'PA mod (high to low)' }
];

const byName = (a: Item, b: Item) => a.name.localeCompare(b.name);
/** Items without the key keep their wiki order, after the others. */
const byKey = (key: (i: Item) => number | undefined) => (a: Item, b: Item) => {
	const x = key(a);
	const y = key(b);
	if (x === undefined || y === undefined) return x === undefined ? (y === undefined ? 0 : 1) : -1;
	return y - x;
};
const compare: Record<SortKey, (a: Item, b: Item) => number> = {
	wiki: () => 0,
	name: byName,
	power: byKey((i) => i.weapon?.power[1]),
	pa: byKey((i) => i.weapon?.paMod)
};

export interface Group {
	name: string;
	category: Category;
	/** Every item of the section, sorted. */
	items: Item[];
}

/** The wiki's sections with all their items, sorted inside each section. */
export function sortedGroups(sort: SortKey): Group[] {
	return data.groups.map((g) => ({
		...g,
		items: items.filter((i) => i.group === g.name).sort(compare[sort])
	}));
}

// --- Search suggestions ---

export interface SourceMatch {
	kind: SourceKind;
	name: string;
	planet: string | null;
	href: string | null;
	count: number;
}

/** Types and planets named by the search, and the drop source it names exactly, if any. */
export function suggestions(query: string) {
	const q = norm(query);
	if (q.length < 3) return { classes: [], planets: [], source: null };
	const close = (name: string) => norm(name) === q || (q.length >= 4 && norm(name).startsWith(q));
	const matchedClasses = classes.filter(close).slice(0, 2);
	const matchedPlanets = PLANETS.filter((p) => close(p) || norm(p.split(' ')[0]) === q);
	let source: SourceMatch | null = null;
	for (const i of items) {
		for (const s of sources.get(i.id)!) {
			const names = [s.name, s.kind === 'area' ? s.name.replace(/ areas$/, '') : s.name];
			if (names.some((n) => norm(n) === q)) {
				source ??= { kind: s.kind, name: s.name, planet: s.planet, href: s.href, count: 0 };
				if (source.kind === s.kind && source.name === s.name) source.count++;
			}
		}
	}
	return { classes: matchedClasses, planets: matchedPlanets, source };
}
