# Unofficial PSU Docs

Fan-made, improved versions of selected reference pages from the
[Phantasy Star Universe Clementine wiki](https://psu-clementine.com/wiki/).
Not affiliated with SEGA or the Clementine team.

Site: https://lecasax.github.io/unofficial-psu-docs/

## Pages

- **Ultimate Drop Table** (first version), based on
  [the wiki page](https://psu-clementine.com/wiki/Ultimate_Drop_Table): every
  Ultimate weapon, Line Shield and unit, where it drops, and its properties,
  with filters by equipment, type, planet and stars.

## Stack

[SvelteKit](https://svelte.dev/docs/kit) with TypeScript, prerendered to a
static site, and [M3 Svelte](https://github.com/KTibow/m3-svelte) for the
Material Design 3 components and theme.

## Run locally

Requires Node.js 24.

```sh
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

Other commands:

- `npm run build` builds the static site into `build/`.
- `npm run preview` serves that build locally.
- `npm run check` type-checks the project.
- `npm run theme -- "#4cc3ff"` regenerates the color theme from a seed color.

## Update the data

The page data is `src/lib/drop-table/data.json`, built from wiki exports in
`data/raw/`:

1. Wiki text: on https://psu-clementine.com/wiki/Special:Export, export the
   pages the build script reads (Ultimate Drop Table, Units, Line Shields,
   Weapons, Missions, Rare Missions, Enemies, Rare Enemies, Bosses) with
   "Include only the current revision", and save the XML in `data/raw/`.
2. Item data: open `data/cargo-download.html` in a browser, save every link
   as JSON, and put the files in `data/raw/cargo/`.
3. Run `npm run data` and read what it says it could not match.

## Deploy

Every push to `main` runs the GitHub Actions workflow in
`.github/workflows/deploy.yml`, which builds the site and publishes it to
GitHub Pages. In the repository settings, Pages → Source must be
"GitHub Actions".
