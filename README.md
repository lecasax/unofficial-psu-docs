# Unofficial PSU Docs

Fan-made, improved versions of selected reference pages from the
[Phantasy Star Universe Clementine wiki](https://psu-clementine.com/wiki/).
Not affiliated with SEGA or the Clementine team.

Site: https://lecasax.github.io/unofficial-psu-docs/

## Pages

- **Ultimate Drop Table** (in progress), based on
  [the wiki page](https://psu-clementine.com/wiki/Ultimate_Drop_Table)

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

## Deploy

Every push to `main` runs the GitHub Actions workflow in
`.github/workflows/deploy.yml`, which builds the site and publishes it to
GitHub Pages. In the repository settings, Pages → Source must be
"GitHub Actions".
