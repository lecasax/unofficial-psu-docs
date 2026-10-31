import rawData from '#lib/drop-table/data.json';
import type { DropTableData } from '#lib/drop-table/types.js';

// Runs at build time only, so the home page does not ship the drop table data.
export function load() {
	const data = rawData as DropTableData;
	return {
		dropTable: {
			items: data.items.length,
			sections: data.groups.length,
			enemies: Object.keys(data.enemies).length,
			missions: Object.keys(data.missions).length,
			weapons: data.items.filter((i) => i.category === 'weapon').length,
			shields: data.items.filter((i) => i.category === 'shield').length,
			units: data.items.filter((i) => i.category === 'unit').length,
			exported: data.meta.exported
		}
	};
}
