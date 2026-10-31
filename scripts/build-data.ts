// Builds src/lib/drop-table/data.json from the wiki data saved in data/raw/:
// - the Special:Export XML (wikitext of the drop table, Units, Line Shields, Missions, Enemies...)
// - the Special:CargoExport JSON pages in data/raw/cargo/ (Weapons, Items, Drops tables)
// Run with `npm run data`. It prints what it could not match; fix those here, never by guessing data.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import type {
	Area,
	Category,
	DropTableData,
	Enemy,
	EnemyKind,
	Item,
	Mission,
	MissionDrop,
	Planet,
	Rank,
	ShieldStats,
	StatusEffect,
	UnitEffect,
	UnitStats,
	WeaponStats
} from '../src/lib/drop-table/types.ts';

const RAW = 'data/raw';
const OUT = 'src/lib/drop-table/data.json';
const WIKI = 'https://psu-clementine.com/wiki/';
const PLANETS: Planet[] = ['GUARDIANS Colony', 'Parum', 'Neudaiz', 'Moatoob'];
const RANKS: Rank[] = ['C', 'B', 'A', 'S'];
const ELEMENTS = ['Neutral', 'Fire', 'Ice', 'Lightning', 'Ground', 'Light', 'Dark'];

const warnings = new Set<string>();
const warn = (msg: string) => warnings.add(msg);

// ---------------------------------------------------------------------------
// Wiki pages from the Special:Export XML

const decode = (s: string) =>
	s
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;/g, "'")
		.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
		.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
		.replace(/&amp;/g, '&');

const xmlFiles = readdirSync(RAW)
	.filter((f) => f.endsWith('.xml'))
	.sort();
if (!xmlFiles.length) throw new Error(`No Special:Export XML in ${RAW}/`);

const pages = new Map<string, { text: string; edited: string }>();
for (const file of xmlFiles) {
	const xml = readFileSync(`${RAW}/${file}`, 'utf8');
	for (const [, body] of xml.matchAll(/<page>([\s\S]*?)<\/page>/g)) {
		const title = decode(/<title>([\s\S]*?)<\/title>/.exec(body)![1]);
		const text = /<text[^>]*>([\s\S]*?)<\/text>/.exec(body)?.[1] ?? '';
		const edited = /<timestamp>([\s\S]*?)<\/timestamp>/.exec(body)![1];
		// Several exports can hold the same page; keep the newest revision.
		if ((pages.get(title)?.edited ?? '') <= edited) pages.set(title, { text: decode(text), edited });
	}
}
const page = (title: string) => {
	const p = pages.get(title);
	if (!p) throw new Error(`Page "${title}" is missing from the exports in ${RAW}/; export it with that title.`);
	return p.text;
};

// ---------------------------------------------------------------------------
// Wikitext helpers

/** Splits on `sep` outside [[links]] and {{templates}}. */
function splitTop(s: string, sep: string): string[] {
	const out: string[] = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < s.length; i++) {
		const two = s.slice(i, i + 2);
		if (two === '[[' || two === '{{') {
			depth++;
			i++;
		} else if ((two === ']]' || two === '}}') && depth > 0) {
			depth--;
			i++;
		} else if (depth === 0 && s.startsWith(sep, i)) {
			out.push(s.slice(start, i));
			start = i + sep.length;
			i += sep.length - 1;
		}
	}
	out.push(s.slice(start));
	return out;
}

/** Links in wikitext, as page title and shown text. */
function links(s: string): { page: string; text: string }[] {
	return [...s.matchAll(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g)]
		.filter(([, p]) => !p.startsWith('File:'))
		.map(([, p, t]) => ({ page: p.trim(), text: (t ?? p).trim() }));
}

/** Wikitext to plain text: keeps link text and span text, drops files and markup. */
function plain(s: string): string {
	return s
		.replace(/\[\[File:[^\]]*\]\]/g, '')
		.replace(/\[\[([^\]|]+)\|([^\]]*)\]\]/g, '$2')
		.replace(/\[\[([^\]]+)\]\]/g, '$1')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/'{2,}/g, '')
		.replace(/︎/g, '')
		.replace(/[ \t]+/g, ' ')
		.replace(/ *\n */g, '\n')
		.trim();
}

const fileName = (s: string) => /\[\[File:([^\]|]+)/.exec(s)?.[1].trim() ?? null;

interface Cell {
	content: string;
	header: boolean;
	rowspan: number;
	colspan: number;
}

/** Parses a wikitext table into rows of cells, filling in rowspans. */
function parseTable(text: string): { cells: Cell[]; header: boolean }[] {
	const raw: Cell[][] = [];
	let row: Cell[] | null = null;
	const addCells = (line: string, header: boolean) => {
		row ??= [];
		const parts = header ? splitTop(line, '!!').flatMap((p) => splitTop(p, '||')) : splitTop(line, '||');
		for (const part of parts) {
			// "attrs | content", where attrs look like key="value" pairs.
			const [first, ...rest] = splitTop(part, '|');
			const isAttrs = rest.length > 0 && (first.trim() === '' || /^\s*[a-z-]+\s*=/i.test(first));
			const attrs = isAttrs ? first : '';
			const content = isAttrs ? rest.join('|') : part;
			const num = (name: string) => Number(new RegExp(`${name}\\s*=\\s*"?(\\d+)`).exec(attrs)?.[1] ?? 1);
			row.push({ content: content.trim(), header, rowspan: num('rowspan'), colspan: num('colspan') });
		}
	};
	for (const line of text.split('\n')) {
		const t = line.trim();
		if (t.startsWith('{|') || t.startsWith('|+')) continue;
		if (t.startsWith('|}')) break;
		if (t.startsWith('|-')) {
			if (row?.length) raw.push(row);
			row = null;
		} else if (t.startsWith('!')) addCells(t.slice(1), true);
		else if (t.startsWith('|')) addCells(t.slice(1), false);
		else if (row?.length && t) row[row.length - 1].content += '\n' + t;
	}
	if (row?.length) raw.push(row);

	const carry = new Map<number, { cell: Cell; left: number }>();
	return raw.map((cells) => {
		const out: Cell[] = [];
		let col = 0;
		const fill = () => {
			let c;
			while ((c = carry.get(col)) && c.left > 0) {
				out.push(c.cell);
				if (--c.left === 0) carry.delete(col);
				col++;
			}
		};
		for (const cell of cells) {
			fill();
			out.push(cell);
			if (cell.rowspan > 1) carry.set(col, { cell, left: cell.rowspan - 1 });
			col += cell.colspan;
		}
		fill();
		return { cells: out, header: cells.every((c) => c.header) };
	});
}

/** Text of a "==Heading==" section, up to the next heading of the same or higher level. */
function section(text: string, heading: string): string {
	const re = new RegExp(`^(=+)\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\1\\s*$`, 'm');
	const m = re.exec(text);
	if (!m) throw new Error(`Heading "${heading}" not found`);
	const rest = text.slice(m.index + m[0].length);
	const next = new RegExp(`^={1,${m[1].length}}[^=]`, 'm').exec(rest);
	return next ? rest.slice(0, next.index) : rest;
}

const firstTable = (text: string) => {
	const start = text.indexOf('{|');
	if (start < 0) throw new Error('No table in section');
	return text.slice(start);
};

/** The table whose opening line contains `marker`. */
const tableWith = (text: string, marker: string) => text.slice(text.lastIndexOf('{|', text.indexOf(marker)));

const toInt = (s: string, what: string): number => {
	const t = plain(s).replace(/,/g, '');
	if (t === '-' || t === '--' || t === '') return 0;
	const n = Number(t);
	if (Number.isNaN(n)) warn(`${what}: "${t}" is not a number`);
	return n;
};

const stars = (s: string) => Number(/(\d+)\s*★/.exec(s)?.[1]) || null;
const rankOfStars = (n: number | null): Rank | null =>
	// 1-3★ C, 4-6★ B, 7-9★ A, 10★ and up S (the Weapons data gives rank S to 13-15★ too).
	n === null ? null : n <= 3 ? 'C' : n <= 6 ? 'B' : n <= 9 ? 'A' : 'S';

const MANUFACTURER_LOGOS: Record<string, string> = {
	'GRM-logo.png': 'G.R.M.',
	'Logo-Y.gif': 'Yohmei',
	'Yomei-logo.png': 'Yohmei',
	'Tenora-logo.png': 'TENORA WORKS',
	'Kubara_logo.gif': 'Kubara',
	'Kubara-logo.png': 'Kubara'
};
const manufacturerFromLogo = (cell: string) => {
	const f = fileName(cell);
	if (!f) return null;
	if (!MANUFACTURER_LOGOS[f]) warn(`Unknown manufacturer logo ${f}`);
	return MANUFACTURER_LOGOS[f] ?? null;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+]/g, '');
const slug = (s: string) =>
	s
		.toLowerCase()
		.replace(/\+/g, '-plus')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
const wikiUrl = (title: string) => WIKI + encodeURIComponent(title.replace(/ /g, '_')).replace(/%2F/g, '/');

// ---------------------------------------------------------------------------
// Cargo tables (JSON pages from Special:CargoExport, any file name)

type Row = Record<string, unknown>;
const cargo: Record<'Weapons' | 'Items' | 'Drops', Row[]> = { Weapons: [], Items: [], Drops: [] };
/** Every page of the Weapons table is here (the last one has fewer than 512 rows). */
let weaponStatsComplete = false;
{
	const dir = `${RAW}/cargo`;
	const files: Record<string, { rows: Row[]; paged: boolean; file: string }[]> = { Weapons: [], Items: [], Drops: [] };
	for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
		const rows = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')) as Row[];
		if (!rows.length) continue;
		const table = 'max attack' in rows[0] ? 'Weapons' : 'description' in rows[0] ? 'Items' : 'table label' in rows[0] ? 'Drops' : null;
		if (!table) {
			warn(`cargo/${file}: unknown table, skipped`);
			continue;
		}
		files[table].push({ rows, paged: '_ID' in rows[0], file });
	}
	for (const table of ['Weapons', 'Items', 'Drops'] as const) {
		const paged = files[table].filter((f) => f.paged);
		// Files with _ID come from the paged links in data/cargo-download.html and supersede older ones.
		const use = paged.length ? paged : files[table];
		const seen = new Set<unknown>();
		for (const { rows } of use) {
			for (const r of rows) {
				if ('_ID' in r) {
					if (seen.has(r._ID)) continue;
					seen.add(r._ID);
				}
				// Text comes HTML-escaped ("Madam&#039;s Parasol/U+", "Yuzu &amp; Iyokan/U+").
				for (const [k, v] of Object.entries(r)) {
					if (typeof v === 'string') r[k] = decode(v);
					else if (Array.isArray(v)) r[k] = v.map((x) => (typeof x === 'string' ? decode(x) : x));
				}
				cargo[table].push(r);
			}
		}
		const full = use.some((f) => f.rows.length < 512);
		if (table === 'Weapons') weaponStatsComplete = full;
		console.log(`Cargo ${table}: ${cargo[table].length} rows from ${use.length} file(s)${full ? '' : ' (may be incomplete: every file has 512 rows)'}`);
	}
}

/**
 * Item ids are hex strings like "01020A03", but the export turns the numeric-looking
 * ones into numbers ("01020403" -> 1020403, "010E0103" -> 1e104). Both sides of a join
 * go through the same conversion, so this key matches them.
 */
const idKey = (v: unknown) =>
	typeof v === 'string' ? v.toUpperCase() : Number.isSafeInteger(v) ? String(v).padStart(8, '0') : `n${String(v)}`;
const hex2 = (v: unknown) => (typeof v === 'number' ? String(v).padStart(2, '0') : String(v).toUpperCase());

/**
 * The item id as the wiki writes it ("01011401"). For ids the export read as scientific
 * notation ("010E0103" -> 1e104), try every middle byte between the row's category and
 * subcategory and its extra id until one reads as the same number.
 */
function hexId(row: Row): string | null {
	const v = row['item id'];
	if (typeof v === 'string') return v.toUpperCase();
	if (Number.isSafeInteger(v)) return String(v).padStart(8, '0');
	const head = hex2(row['category id']) + hex2(row['subcategory id']);
	const tail = hex2(row['extra id']);
	for (let b = 0; b < 256; b++) {
		const id = head + b.toString(16).toUpperCase().padStart(2, '0') + tail;
		if (Number(id) === v) return id;
	}
	warn(`${row.name}: cannot rebuild item id from ${String(v)}`);
	return null;
}

/**
 * Weapon pictures on the wiki are files named after the item id ("01011401.png"), stored
 * in MediaWiki's hashed folders (first characters of the file name's MD5). The page links
 * to these files; nothing is copied. Not every weapon is known to have one.
 */
function weaponImage(id: string): Item['image'] {
	const file = `${id}.png`;
	const h = createHash('md5').update(file).digest('hex');
	const dir = `${h[0]}/${h.slice(0, 2)}`;
	return { thumb: `${WIKI}images/thumb/${dir}/${file}/300px-${file}`, full: `${WIKI}images/${dir}/${file}` };
}

const itemsById = new Map(cargo.Items.map((r) => [idKey(r.id), r]));
const weaponsByName = new Map<string, Row[]>();
for (const w of cargo.Weapons) {
	const k = norm(String(w.name));
	weaponsByName.set(k, [...(weaponsByName.get(k) ?? []), w]);
}

// ---------------------------------------------------------------------------
// Weapon types, the class matrix and stats

const WEAPON_TYPES: { group: string; type: string; sub: string }[] = [
	['Swords', 'Sword', '01'],
	['Knuckles', 'Knuckles', '02'],
	['Spears', 'Spear', '03'],
	['Double Sabers', 'Double Saber', '04'],
	['Axes', 'Axe', '05'],
	['Twin Sabers', 'Twin Saber', '06'],
	['Twin Daggers', 'Twin Dagger', '07'],
	['Twin Claws', 'Twin Claw', '08'],
	['Sabers', 'Saber', '09'],
	['Daggers', 'Dagger', '0A'],
	['Claws', 'Claw', '0B'],
	['Whips', 'Whip', '0C'],
	['Slicers', 'Slicer', '0D'],
	['Rifles', 'Rifle', '0E'],
	['Shotguns', 'Shotgun', '0F'],
	['Longbows', 'Longbow', '10'],
	['Grenades', 'Grenade', '11'],
	['Lasers', 'Laser Cannon', '12'],
	['Twin Handguns', 'Twin Handgun', '13'],
	['Handguns', 'Handgun', '14'],
	['Crossbows', 'Crossbow', '15'],
	['Cards', 'Card', '16'],
	['Machineguns', 'Machinegun', '17'],
	['Rods', 'Rod', '18'],
	['Wands', 'Wand', '19'],
	['TCSMs', 'TCSM', '1A'],
	['RCSMs', 'RCSM', '1B']
].map(([group, type, sub]) => ({ group, type, sub }));
const typeOfGroup = new Map(WEAPON_TYPES.map((t) => [t.group, t]));

// Drop table names that differ from the wiki's item data, checked by hand: same weapon type
// and rarity, and the wiki abbreviates the same way elsewhere ("Karakasa J. Gun").
const WEAPON_ALIASES: Record<string, string> = {
	'Bangasa J. Gun/U+': 'Bangasa Jikomi Gun/U+'
};

// Same lists as the wiki's Cargo Rows/Weapon Lists templates.
const RANGED = ['Rifle', 'Shotgun', 'Longbow', 'Grenade', 'Laser Cannon', 'Twin Handgun', 'Handgun', 'Crossbow', 'Card', 'Machinegun', 'RCSM'];
const TECHNIC = ['Rod', 'Wand', 'TCSM'];
const NO_RANGE = [...RANGED, ...TECHNIC, 'Slicer'];

const STATUS_NAMES = [
	'None', 'Burn', 'Poison', 'Infection', 'Shock', 'Silence', 'Freeze', 'Sleep', 'Stun', 'Confuse', 'Charm',
	'Incapacitation', 'HP Steal', 'Reflect Damage', 'HP Affects Power', 'Auto Damage', 'Auto Recovery',
	'Boost ATP', 'Lower ATP', 'Boost DFP', 'Lower DFP', 'Boost TP/MST', 'Lower TP/MST', 'Boost ATA/EVP',
	'Lower ATA/EVP', 'Self Sacrifice', 'Boost All', 'Reduce Physical Damage', 'Reduce TECHNIC Damage', 'Slow', 'Trap Stun'
];
const RCSM_SHOTS: Record<number, string> = { 1: 'Spread', 4: 'Laser', 5: 'Laser Bullet', 6: 'Shot' };
const MANUFACTURERS = ['G.R.M.', 'Yohmei', 'TENORA WORKS', 'Kubara'];

/** "Usable Weapons by Type" on the Weapons page: class -> weapon type -> max rank. */
const classMatrix = new Map<string, Map<string, Rank | null>>();
{
	const rows = parseTable(firstTable(section(page('Weapons'), 'Usable Weapons by Type')));
	const columns = rows[0].cells.slice(1).map((c) => /\{\{(.+?) icon\}\}/.exec(c.content)?.[1] ?? '?');
	for (const { cells } of rows.slice(1)) {
		const cls = links(cells[0].content)[0]?.text;
		if (!cls) continue;
		const ranks = new Map<string, Rank | null>();
		cells.slice(1).forEach((c, i) => {
			const v = plain(c.content);
			ranks.set(columns[i], RANKS.includes(v as Rank) ? (v as Rank) : null);
		});
		classMatrix.set(cls, ranks);
	}
	const missing = WEAPON_TYPES.filter((t) => !columns.includes(t.type));
	if (missing.length) warn(`Class matrix lacks columns: ${missing.map((t) => t.type).join(', ')}`);
}
const CLASSES = [...classMatrix.keys()];
// Master types "can only use S-rank Weapons and Line Shields" (Types page and each Master
// page). The Fighmaster and Masterforce pages add "with the exception of Handguns", which
// they use at C rank.
const MASTER_CLASSES = ['Fighmaster', 'Gunmaster', 'Masterforce', 'Acromaster'];
const S_ONLY_EXCEPTIONS: Record<string, string[]> = { Fighmaster: ['Handgun'], Masterforce: ['Handgun'] };

function weaponStats(w: Row, type: string): WeaponStats {
	const num = (k: string) => Number(w[k] ?? 0);
	const arr = (k: string) => (Array.isArray(w[k]) ? (w[k] as number[]) : []);
	const atk = arr('max attack');
	const pp = arr('max pp');
	const status = new Map<string, StatusEffect>();
	const elements = (w.elements as string[] | undefined) ?? ELEMENTS;
	// The data has a status for every element, also for elements the weapon cannot drop with.
	for (const el of ELEMENTS.filter((e) => elements.includes(e))) {
		const id = num(`${el.toLowerCase()} status id`);
		if (!id) continue;
		const level = num(`${el.toLowerCase()} status level`);
		const name = STATUS_NAMES[id] ?? `Status ${id}`;
		if (!STATUS_NAMES[id]) warn(`${w.name}: unknown status id ${id}`);
		const key = `${name} ${level}`;
		status.set(key, { name, level, elements: [...(status.get(key)?.elements ?? []), el] });
	}
	if (num('self status id')) warn(`${w.name}: has a self status effect, not shown yet`);
	const bonuses: Record<string, number> = {};
	for (const k of ['atp', 'ata', 'dfp', 'tp', 'evp', 'mst', 'sta']) if (num(k)) bonuses[k.toUpperCase()] = num(k);
	const rcsm = type === 'RCSM';
	const description = itemsById.get(idKey(w['item id']))?.description;
	return {
		manufacturer: MANUFACTURERS[num('extra id')] ?? null,
		requirement: { stat: TECHNIC.includes(type) ? 'TP' : RANGED.includes(type) ? 'ATA' : 'ATP', value: num('stat') },
		powerLabel: TECHNIC.includes(type) || rcsm ? 'Tech.' : 'Attack',
		power: [atk[0] ?? 0, atk.at(-1) ?? 0],
		pp: rcsm || !pp.length ? null : [pp[0], pp.at(-1)!],
		maxGrind: num('max grind'),
		variance: num('variance'),
		accuracy: TECHNIC.includes(type) ? null : num('accuracy'),
		critMod: rcsm ? null : num('critical attack mod'),
		paMod: num('pa mod'),
		seMod: rcsm ? null : num('se mod'),
		range: NO_RANGE.includes(type) ? null : num('weapon range'),
		maxTargets: num('max target'),
		penetration: type === 'Shotgun' ? num('penetration override') > 0 : null,
		rcsm: rcsm && num('rcsm number of shot') > 0 ? { shotType: RCSM_SHOTS[num('rcsm bullet type')] ?? null, shotDelay: num('rcsm fire time') } : null,
		elements,
		status: [...status.values()],
		bonuses,
		races: (w.race as string[]) ?? [],
		sexes: (w.sex as string[]) ?? [],
		description: typeof description === 'string' ? description.replace(/\s*\n\s*/g, ' ').trim() : null
	};
}

// ---------------------------------------------------------------------------
// Units and Line Shields (static tables on the wiki)

const UNIT_STATS: Record<UnitStats['slot'], string[]> = {
	Head: ['TP', 'MST'],
	Arm: ['ATP', 'ATA'],
	Body: ['DFP', 'EVP'],
	Extra: ['STA']
};
const units = new Map<string, { stars: number | null; stats: UnitStats; page: string }>();
for (const slot of Object.keys(UNIT_STATS) as UnitStats['slot'][]) {
	const labels = UNIT_STATS[slot];
	for (const { cells, header } of parseTable(firstTable(section(page('Units'), `${slot} Units`)))) {
		if (header) continue;
		const [rarity, name, mfr, ...rest] = cells;
		const link = links(name.content)[0];
		if (!link) continue;
		const statCells = rest.slice(0, labels.length);
		const [effect, comment] = rest.slice(labels.length);
		const effects: UnitEffect[] = plain(effect?.content ?? '')
			.split('\n')
			.filter((t) => t && !/^-+$|^no special effects\.?$/i.test(t))
			.map((t) => ({ text: t.replace(/\s+/g, ' '), up: t.includes('↑') ? true : t.includes('↓') ? false : null }));
		const note = plain(comment?.content ?? '');
		units.set(norm(link.text), {
			stars: stars(rarity.content),
			page: link.page,
			stats: {
				slot,
				manufacturer: manufacturerFromLogo(mfr.content),
				// A few units list two values ("475<br>500") without saying why; keep both as written.
				stats: labels.map((label, i) => ({ label, value: plain(statCells[i]?.content ?? '').replace(/\n/g, ' / ') || '0' })),
				effects,
				comment: note && note !== '-' ? note : null
			}
		});
	}
}

const shields = new Map<string, { stars: number | null; stats: ShieldStats }>();
for (const { cells, header } of parseTable(tableWith(page('Line Shields'), 'sortable'))) {
	if (header || cells.length < 14) continue;
	const [rarity, name, mfr, def, eva, ment, end, h, a, b, e, dfp, ele, comment] = cells;
	const link = links(name.content)[0];
	if (!link) continue;
	const slot = (c: Cell) => c.content.includes('✔');
	const note = plain(comment.content);
	const element = fileName(ele.content)?.replace(/_Icon\.gif$/i, '') ?? null;
	shields.set(norm(link.text), {
		stars: stars(rarity.content),
		stats: {
			manufacturer: manufacturerFromLogo(mfr.content),
			def: toInt(def.content, `${link.text} DFP`),
			eva: toInt(eva.content, `${link.text} EVP`),
			ment: toInt(ment.content, `${link.text} MST`),
			end: toInt(end.content, `${link.text} STA`),
			slots: { head: slot(h), arm: slot(a), body: slot(b), extra: slot(e) },
			dfpRequired: plain(dfp.content) && plain(dfp.content) !== '-' ? toInt(dfp.content, `${link.text} DFP req`) : null,
			element,
			comment: note && note !== '-' ? note : null
		}
	});
}

// ---------------------------------------------------------------------------
// Missions, enemies and areas -> planets

const missionPlanet = new Map<string, Planet>();
{
	const text = page('Missions');
	const tabs = text.split(/^\|-\|/m).slice(1);
	for (const tab of tabs) {
		const name = tab.slice(0, tab.indexOf('=')).trim() as Planet;
		if (!PLANETS.includes(name)) {
			warn(`Missions page: unknown tab "${name}"`);
			continue;
		}
		for (const l of links(tab)) if (!missionPlanet.has(l.page)) missionPlanet.set(l.page, name);
	}
	for (const [, heading, body] of page('Rare Missions').matchAll(/^===\s*(.+?)\s*===\s*$([\s\S]*?)(?=^=|(?![\s\S]))/gm)) {
		const planet = PLANETS.find((p) => p === heading);
		if (planet) for (const l of links(body)) if (!missionPlanet.has(l.page)) missionPlanet.set(l.page, planet);
	}
}
/** Mission page for a drop table name: "Mad Beasts (Ultimate)" -> "The Mad Beasts". */
const missionPage = (name: string) => {
	const base = name.replace(/\s*\(Ultimate\)$/, '');
	return [base, `The ${base}`].find((p) => missionPlanet.has(p) || pages.has(p)) ?? null;
};

/**
 * Area page -> planet, from Template:Areas: a header row of planets, then one cell of area
 * links per planet. Areas listed under several planets (RELICS) map to null.
 */
const areaPlanet = new Map<string, Planet | null>();
{
	const order: Planet[] = [];
	let cell = -1;
	for (const line of page('Template:Areas').split('\n').map((l) => l.trim())) {
		if (line.startsWith('|-')) {
			if (order.length) cell = 0;
		} else if (line.startsWith('|') && !line.startsWith('|}')) {
			const found = links(line).map((l) => l.page);
			if (cell < 0) {
				const planet = PLANETS.find((p) => found.includes(p));
				if (planet) order.push(planet);
			} else if (cell < order.length) {
				for (const a of found) areaPlanet.set(a, areaPlanet.has(a) && areaPlanet.get(a) !== order[cell] ? null : order[cell]);
				cell++;
			}
		}
	}
}
const planetsOfLinks = (wikitext: string) => {
	const found = new Set(links(wikitext).map((l) => areaPlanet.get(l.page)));
	return PLANETS.filter((p) => found.has(p));
};

/** Planet of a mission page from its infobox "Field" row, when the known fields agree. */
function fieldPlanet(title: string): Planet | null {
	const lines = page(title).split('\n');
	const i = lines.findIndex((l) => /^\|\s*Field\s*$/.test(l.trim()));
	const found = i < 0 ? [] : planetsOfLinks(lines[i + 1] ?? '');
	return found.length === 1 ? found[0] : null;
}

const enemyInfo = new Map<string, { kinds: Set<EnemyKind>; planets: Set<Planet>; rare: boolean; page: string }>();
function addEnemy(name: string, pageTitle: string, kind: EnemyKind, planet: Planet | null, rare: boolean) {
	const e = enemyInfo.get(name) ?? { kinds: new Set(), planets: new Set(), rare: false, page: pageTitle };
	e.kinds.add(kind);
	if (planet) e.planets.add(planet);
	e.rare ||= rare;
	// Found by page title (as the drop table links it) or by shown name.
	enemyInfo.set(pageTitle, e);
	enemyInfo.set(name, e);
}
const listItems = (text: string) => text.split('\n').filter((l) => l.startsWith('*')).flatMap((l) => links(l));
const KIND_OF_HEADING: [RegExp, EnemyKind][] = [
	[/^Native Creatures/, 'Native creature'],
	[/^Humanoids/, 'Humanoid'],
	[/^Machinery/, 'Machinery'],
	[/^SEED-Forms/, 'SEED-Form'],
	[/^Stateria/, 'Stateria'],
	[/^Rare Enemies/, 'Rare enemy'],
	[/^Event Exclusive/, 'Event enemy']
];
for (const [title, rare] of [['Enemies', false], ['Rare Enemies', true]] as const) {
	for (const [, heading, body] of page(title).matchAll(/^=+\s*(.+?)\s*=+\s*$([\s\S]*?)(?=^=|(?![\s\S]))/gm)) {
		const kind = KIND_OF_HEADING.find(([re]) => re.test(heading))?.[1];
		if (!kind) continue;
		const planet = PLANETS.find((p) => heading.includes(`(${p})`)) ?? null;
		for (const l of listItems(body)) addEnemy(l.text, l.page, kind, planet, rare || kind === 'Rare enemy');
	}
}
for (const [, heading, body] of page('Bosses').matchAll(/^===\s*(.+?)\s*===\s*$([\s\S]*?)(?=^=|(?![\s\S]))/gm)) {
	const planet = PLANETS.find((p) => p === heading) ?? null;
	for (const l of listItems(body)) addEnemy(l.text, l.page, 'Boss', planet, false);
}

const AREAS: Record<string, Area> = {
	// Names as in the drop table ("<name> Areas"); planets from Template:Areas and the planet pages.
	Canyon: { planets: ['Moatoob'], note: null },
	Desert: { planets: ['Moatoob'], note: null },
	'Moatoob Caves': { planets: ['Moatoob'], note: null },
	HIVE: { planets: ['GUARDIANS Colony'], note: null },
	'Linear Line': { planets: ['GUARDIANS Colony'], note: null },
	Habirao: { planets: ['Neudaiz'], note: null },
	'Neudaiz Forest': { planets: ['Neudaiz'], note: null },
	'Neudaiz Islands': { planets: ['Neudaiz'], note: null },
	Temple: { planets: ['Neudaiz'], note: null },
	'Parum Underground': { planets: ['Parum'], note: null },
	'Raffon Lakeshore': { planets: ['Parum'], note: null },
	'Raffon Meadow': { planets: ['Parum'], note: null },
	Rozenom: { planets: ['Parum'], note: null },
	Train: { planets: ['Parum'], note: null },
	RELICS: { planets: [...PLANETS], note: 'There are RELICS areas on every planet; the wiki does not say which ones drop this.' },
	Global: { planets: [], note: 'The wiki does not explain what "Global" means here.' }
};

// ---------------------------------------------------------------------------
// Drops table: which box a mission drop comes from

const boxes = new Map<string, Set<string>>();
{
	const weaponNameById = new Map(cargo.Weapons.map((w) => [idKey(w['item id']), String(w.name)]));
	for (const d of cargo.Drops) {
		const k = idKey(d['item id']);
		const name = itemsById.get(k)?.name ?? weaponNameById.get(k);
		if (!name) continue;
		const key = `${d.source}\u0000${norm(String(name))}`;
		boxes.set(key, (boxes.get(key) ?? new Set()).add(String(d['table label'])));
	}
}

// ---------------------------------------------------------------------------
// The drop table itself

const UNIT_GROUPS: Record<string, UnitStats['slot']> = { 'Head Units': 'Head', 'Arm Units': 'Arm', 'Body Units': 'Body', 'Extra Units': 'Extra' };
const categoryOf = (group: string): Category | null =>
	typeOfGroup.has(group) ? 'weapon' : group === 'Line Shields' ? 'shield' : group in UNIT_GROUPS ? 'unit' : null;

const items: Item[] = [];
const groups: { name: string; category: Category }[] = [];
const enemies: Record<string, Enemy> = {};
const missions: Record<string, Mission> = {};
const areas: Record<string, Area> = {};
const ids = new Set<string>();

let group = '';
for (const { cells, header } of parseTable(firstTable(page('Ultimate Drop Table')))) {
	if (header) {
		if (cells.length === 1) {
			group = plain(cells[0].content);
			const category = categoryOf(group);
			if (!category) warn(`Drop table: unknown section "${group}"`);
			else groups.push({ name: group, category });
		}
		continue;
	}
	const category = categoryOf(group);
	if (!category || cells.length !== 4) {
		if (category) warn(`Drop table: row with ${cells.length} cells in ${group}`);
		continue;
	}
	const [nameCell, enemyCell, missionCell, areaCell] = cells;
	const list = (c: Cell) => links(c.content).map((l) => l.page).filter((p) => p !== 'x');
	const name = links(nameCell.content)[0]?.page;
	if (!name) continue;

	const weaponType = typeOfGroup.get(group)?.type;
	const item: Item = {
		id: '',
		name,
		group,
		typeName: weaponType ?? (category === 'shield' ? 'Line Shield' : `${UNIT_GROUPS[group]} unit`),
		category,
		style: !weaponType
			? (category as 'shield' | 'unit')
			: TECHNIC.includes(weaponType)
				? 'technic'
				: RANGED.includes(weaponType)
					? 'ranged'
					: 'melee',
		stars: null,
		rank: null,
		classes: null,
		planets: [],
		enemies: list(enemyCell),
		missions: [],
		areas: list(areaCell).map((a) => a.replace(/ Areas$/, '')),
		wikiUrl: null,
		image: null,
		weapon: null,
		shield: null,
		unit: null
	};
	let id = slug(name);
	while (ids.has(id)) id += '-2';
	ids.add(id);
	item.id = id;

	if (category === 'weapon') {
		const t = typeOfGroup.get(group)!;
		const found = weaponsByName.get(norm(WEAPON_ALIASES[name] ?? name)) ?? [];
		const w = found.find((r) => hex2(r['subcategory id']) === t.sub) ?? found[0];
		if (!w) {
			warn(`No weapon data for "${name}" (${group})`);
		} else {
			if (hex2(w['subcategory id']) !== t.sub) warn(`"${name}" is in ${group} but its data says subcategory ${w['subcategory id']}`);
			item.stars = Number(w.rarity) + 1;
			item.rank = RANKS[Number(w.rank) - 1] ?? rankOfStars(item.stars);
			item.weapon = weaponStats(w, t.type);
			item.wikiUrl = wikiUrl(String(w._pageName));
			const hex = hexId(w);
			if (hex) item.image = weaponImage(hex);
			const allowed = new Set((w.class as string[]) ?? CLASSES);
			item.classes = CLASSES.filter((c) => {
				const max = classMatrix.get(c)?.get(t.type);
				if (!allowed.has(c) || !max || !item.rank || RANKS.indexOf(item.rank) > RANKS.indexOf(max)) return false;
				return !MASTER_CLASSES.includes(c) || item.rank === 'S' || !!S_ONLY_EXCEPTIONS[c]?.includes(t.type);
			});
		}
	} else if (category === 'shield') {
		const s = shields.get(norm(name));
		if (!s) warn(`No Line Shields row for "${name}"`);
		else {
			item.stars = s.stars;
			item.rank = rankOfStars(s.stars);
			item.shield = s.stats;
			item.wikiUrl = wikiUrl('Line Shields');
			// Types page: "Master Types can only use S-Rank Weapons and Line Shields."
			item.classes = CLASSES.filter((c) => item.rank === 'S' || !MASTER_CLASSES.includes(c));
		}
	} else {
		const u = units.get(norm(name));
		if (!u) warn(`No Units row for "${name}"`);
		else {
			if (u.stats.slot !== UNIT_GROUPS[group]) warn(`"${name}" is in ${group} but the Units page has it under ${u.stats.slot}`);
			item.stars = u.stars;
			item.rank = rankOfStars(u.stars);
			item.unit = u.stats;
			item.wikiUrl = wikiUrl('Units') + `#${UNIT_GROUPS[group]}_Units`;
			// Units go on a Line Shield of the same or higher rank, and every type can use S-rank shields.
			item.classes = [...CLASSES];
		}
	}

	const planets = new Set<Planet>();
	for (const m of list(missionCell)) {
		const mPage = missionPage(m);
		const planet = mPage ? (missionPlanet.get(mPage) ?? fieldPlanet(mPage)) : null;
		if (!mPage) warn(`Mission "${m}" has no wiki page and is not on the Missions pages`);
		else if (!planet) warn(`Mission "${m}": its page does not say which planet`);
		missions[m] ??= { planet, wikiUrl: mPage ? wikiUrl(mPage) : null };
		if (planet) planets.add(planet);
		const found = boxes.get(`${m}\u0000${norm(name)}`);
		item.missions.push({ name: m, box: found ? [...found].sort().join(' / ') : null } satisfies MissionDrop);
	}
	for (const e of item.enemies) {
		const m = /^(.*?)\s*\((Neutral|Fire|Ice|Lightning|Ground|Light|Dark)\)$/.exec(e);
		const base = m ? m[1] : e;
		const info = enemyInfo.get(base) ?? [...enemyInfo.entries()].find(([k]) => norm(k) === norm(base))?.[1];
		// An enemy on no list may still have a page: its intro says where it lives.
		const intro = !info && pages.has(base) ? page(base).split(/\n(?:\{\||=)/)[0] : null;
		if (!info && intro === null) warn(`Enemy "${e}" is not on the Enemies, Rare Enemies or Bosses pages`);
		enemies[e] ??= {
			kinds: info ? [...info.kinds] : [],
			rare: info?.rare ?? false,
			planets: info ? PLANETS.filter((p) => info.planets.has(p)) : intro ? planetsOfLinks(intro) : [],
			element: m ? m[2] : null,
			wikiUrl: info ? wikiUrl(info.page) : intro !== null ? wikiUrl(base) : null
		};
		for (const p of enemies[e].planets) planets.add(p);
	}
	for (const a of item.areas) {
		const info = AREAS[a];
		if (!info) warn(`Area "${a}" has no planet mapping`);
		areas[a] ??= info ?? { planets: [], note: null };
		for (const p of areas[a].planets) planets.add(p);
	}
	item.planets = PLANETS.filter((p) => planets.has(p));
	items.push(item);
}

// ---------------------------------------------------------------------------

const exported = xmlFiles
	.map((f) => /(\d{4}-\d{2}-\d{2})/.exec(f)?.[1] ?? statSync(`${RAW}/${f}`).mtime.toISOString().slice(0, 10))
	.sort()
	.at(-1)!;
const data: DropTableData = {
	meta: { wikiEdited: pages.get('Ultimate Drop Table')!.edited.slice(0, 10), exported, weaponStatsComplete },
	classes: CLASSES,
	groups,
	items,
	enemies,
	missions,
	areas
};
writeFileSync(OUT, JSON.stringify(data) + '\n');

const count = (f: (i: Item) => boolean) => items.filter(f).length;
console.log(`\n${items.length} items in ${groups.length} groups -> ${OUT}`);
console.log(`  with properties: ${count((i) => !!(i.weapon || i.shield || i.unit))}`);
console.log(`  with a planet: ${count((i) => i.planets.length > 0)}`);
console.log(`  mission drops with a box: ${items.flatMap((i) => i.missions).filter((m) => m.box).length} of ${items.flatMap((i) => i.missions).length}`);
const races = new Set(items.flatMap((i) => (i.weapon ? [i.weapon.races.join('/')] : [])));
console.log(`  weapon race lists: ${[...races].join(' | ') || '(none)'}`);
if (warnings.size) {
	console.log(`\n${warnings.size} warning(s):`);
	for (const w of warnings) console.log(`  - ${w}`);
}
