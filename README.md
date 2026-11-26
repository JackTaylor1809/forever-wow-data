# Forever WoW data

Item source data (drops, vendors, quest rewards) used by the Forever WoW armoury site.

## Where it comes from

Derived from [forever-db](https://github.com/foreverfraddons/forever-db), a database for World of Warcraft: Forever that
merges several open sources and in-game recordings by Forever players. forever-db's merged data is licensed under the
GNU General Public License v3.0; the sources behind it and their licences are listed in `FOREVER-DB-LICENSE-DATA.txt`
(QuestieDB Forever, AllTheThings, VMaNGOS, cMaNGOS classic-db, pfQuest, Drop Tables contributors under CC BY-SA 4.0, and
others). Their licence notices are included here (`FOREVER-DB-*.txt`, `CMANGOS-COPYRIGHT.md`, `ZONES-LICENSE-MIT.md`).

Where Forever has its own data or players have recorded it in game, forever-db prefers that over Classic-era data. Items
only Classic-era sources know about may still differ in World of Warcraft: Forever. Treat entries as a guide, not a guarantee.

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

Zone names and coordinates come from forever-db's Forever map positions (0-1000 on each zone map, shown here as 0-100). Where
an NPC has many spawns, nearby ones are averaged into a centre point (third value 1) and at most 3 points are shown.

Changes made: filtered to the most relevant sources per item (best drop rates first) and reshaped into a compact format.

## Maps

`maps/` holds zone map images (1002x668) taken from the Warcraft Wiki's World of Warcraft: Forever zone maps. The artwork is
(c) Blizzard Entertainment and is shown here only to illustrate item locations on a non-commercial fan site. World of Warcraft
and Blizzard Entertainment are trademarks or registered trademarks of Blizzard Entertainment, Inc. These images are not covered
by this repository's data licences and will be removed promptly at Blizzard's request.
