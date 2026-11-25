# Forever WoW data

Item source data (drops, vendors, quest rewards) used by the Forever WoW armoury site.

## Where it comes from

Derived from the [CMaNGOS Classic database](https://github.com/cmangos/classic-db), licensed under the
GNU General Public License v3.0. That database describes the original Classic-era game, so entries
**may differ in World of Warcraft: Forever**. Treat them as a guide, not a guarantee.

World of Warcraft content and materials are trademarks and copyrights of Blizzard Entertainment.
This is a non-commercial fan project and is not affiliated with Blizzard Entertainment.

## Files

- `item-sources-N.json`: items keyed by item id. `n` = NPC drops (name, level low, level high, map, chance %),
  `o` = object drops (name, map, chance %), `v` = vendors (name, map), `q` = quest rewards (id, title, level).
- `manifest.json`: number of chunks.

Changes made: filtered to the most relevant sources per item and reshaped into a compact format.
