# Unofficial PSU Docs

Fan-made, improved versions of **selected** pages from the Phantasy Star
Universe Clementine wiki (https://psu-clementine.com/wiki/). Not a full copy
of the wiki: improve a few pages at a time.

The user writes in Portuguese (pt-BR). Site content is in English, like the
source wiki and the item names.

## Stack

- Static site on GitHub Pages: plain HTML, CSS, JS and JSON data files.
- No backend, no build step. Shared styles live in `assets/style.css`.
- `.nojekyll` keeps GitHub Pages from running Jekyll on the files.

## First page: Ultimate Drop Table

Source: https://psu-clementine.com/wiki/Ultimate_Drop_Table

The wiki table has the columns Weapon | Enemy Drop | Mission Drop | Area Drops,
grouped by weapon type (Swords, Knuckles, Spears, Double Sabers, Axes,
Handguns, Crossbows, Cards, Machineguns, Rods, Wands, TCSMs, maybe more).

Planned improvements:
1. Views by mission, enemy and area, generated from the same data.
2. Weapon attributes (stars, element, classes, required level, icon).
3. Source context: boss/rare/common enemy, where the enemy spawns,
   drop rate (only if the server team provides it; never invent it).
4. Cleanup: `x` placeholders become "—", explain the `/U+` suffix and
   Mission vs Area columns, consistent names (e.g. `YG-01Z BUG` /
   `YG01U BUGGES` / `YG-01K BUGGE`), no links to missing wiki pages.
5. Search, filters, sorting, mobile-friendly cards.
6. "Last verified" date, data source, and a way to report drops
   (GitHub issues).

## Data source notes

- Direct downloads from psu-clementine.com (curl) return 403. Do not try to
  get around the block.
- Large pages fetched with WebFetch come back partly summarized, so they
  are not reliable for full data extraction.
- The best source is the page's "View source" text, copied by the user from
  the browser into `data/raw/`.
- Weapon icons and images are SEGA's and hosted on the wiki. Ask the wiki
  team before copying them.
