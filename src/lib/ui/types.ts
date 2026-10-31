import type iconSearch from '@ktibow/iconset-material-symbols/search';

/** A Material Symbols icon from @ktibow/iconset-material-symbols. */
export type IconData = typeof iconSearch;

export interface MenuOption<T extends string = string> {
	value: T;
	label: string;
	/** Shown at the end of the item, e.g. how many results the option gives. */
	count?: number;
	icon?: IconData;
}

export interface SearchOption<T extends string = string> extends MenuOption<T> {
	/** A second, smaller line under the label. */
	support?: string | null;
	/** Subheader the option is listed under while the search is empty. */
	section?: string;
	/** Shown dimmed and cannot be picked (it would give no results). */
	disabled?: boolean;
}
