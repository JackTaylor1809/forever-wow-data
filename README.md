# Forever WoW data

Item source data (drops, vendors, quest rewards) used by the Forever WoW armoury site.

## Where it comes from

Derived from the [CMaNGOS Classic database](https://github.com/cmangos/classic-db), licensed under the
GNU General Public License v3.0. That database describes the original Classic-era game, so entries
**may differ in World of Warcraft: Forever**. Treat them as a guide, not a guarantee.

World of Warcraft content and materials are trademarks and copyrights of Blizzard Entertainment.
This is a non-commercial fan project and is not affiliated with Blizzard Entertainment.

## Files

- `item-sources-N.json`: items keyed by item id.
  - `n` = NPC drops: `[name, level low, level high, map, chance %, zone, coords]`
  - `o` = object drops: `[name, map, chance %, zone, coords]`
  - `v` = vendors: `[name, map, zone, coords]`
  - `q` = quest rewards: `[quest id, title, level]`
  - `zone` is an open-world zone name (absent for dungeons and raids). `coords` is a list of `[x, y]` positions on that zone's
    map (0-100). A third value of `1` means the position is the approximate centre of several spawns. An empty list means
    the spawns are too spread out to give a single position.
- `manifest.json`: number of chunks.

Zone names and coordinates are worked out from CMaNGOS spawn positions using zone bounds from the vanilla 1.12.1 client
(`WorldMapArea`), taken from [TheGrayDot/wow-vanilla-world-coords](https://github.com/TheGrayDot/wow-vanilla-world-coords)
(MIT licence, see `ZONES-LICENSE-MIT.md`). Zones near borders may be off, and spawns on Forever may differ.

Changes made: filtered to the most relevant sources per item and reshaped into a compact format.
