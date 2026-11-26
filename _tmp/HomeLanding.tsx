import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const TEXT = "#F4F5F7"
const MUTED = "#9BA3B0"
const EDGE = "1px solid rgba(255,255,255,0.14)"
const GLASS = "rgba(255,255,255,0.07)"
const BLUR = "blur(18px) saturate(1.4)"
const SHADOW = "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.14)"

type Props = { part: "hero" | "body"; apiUrl: string; accent: string }

const TOOLS: { t: string; d: string; href: string; tag?: string; g: string }[] = [
    { t: "Character Search", d: "Gear, talents, stats, collections and more for any Forever character, US and EU checked at once.", href: "/armoury", g: "M11 4a7 7 0 1 0 4.2 12.6l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" },
    { t: "Item Database", d: "Where every item drops, how often, with the spawn marked on the zone map.", href: "/items", tag: "Maps added", g: "M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.2 6.6 3.7L12 11.6 5.4 7.9 12 4.2ZM5 9.6l6 3.4v7L5 16.6v-7Zm14 0v7L13 20v-7l6-3.4Z" },
    { t: "Upgrade Finder", d: "Pick a class and spec. We flag your weak slots and show where better gear comes from.", href: "/upgrades", tag: "New", g: "M12 3 5 11h4v8h6v-8h4l-7-8Z" },
    { t: "Leaderboards", d: "Item level, honourable kills and PvP rank ladders. Click any name to open that character.", href: "/leaderboards", g: "M5 20V10h4v10H5Zm5 0V4h4v16h-4Zm5 0v-7h4v7h-4Z" },
    { t: "Talent Planner", d: "Plan all three talent trees, point by point.", href: "/talents", g: "M12 2a3 3 0 0 1 1 5.8V10h4a2 2 0 0 1 2 2v2.2a3 3 0 1 1-2 0V12h-4v2.2a3 3 0 1 1-2 0V12H7v2.2a3 3 0 1 1-2 0V12a2 2 0 0 1 2-2h4V7.8A3 3 0 0 1 12 2Z" },
    { t: "Popular Builds", d: "See the talent builds Forever players are really using, by class.", href: "/builds", g: "M4 5h16v2H4V5Zm0 6h16v2H4v-2Zm0 6h10v2H4v-2Z" },
    { t: "Guides", d: "Player-written guides, approved by moderators. Sign in with Discord to write your own.", href: "/guides", tag: "New", g: "M5 3h11l3 3v15H5V3Zm2 2v14h10V7h-2.5V5H7Zm2 6h6v2H9v-2Zm0 4h6v2H9v-2Z" },
    { t: "Discord Bot", d: "Look up characters and items without leaving Discord. Link your character in one click.", href: "/discord", g: "M7 5h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-2.4l-1.6 2-1.6-2H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Zm2.5 5a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Zm5 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z" },
]

const NEXT: { t: string; d: string }[] = [
    { t: "Comments on items and guides", d: "Share tips, upvote the useful ones and report spam, moderated through Discord." },
    { t: "“Where I got this” reports", d: "Players confirm drops in game so the rates keep getting better." },
    { t: "Shareable character cards", d: "A clean image of your gear and stats to post anywhere." },
    { t: "Patch-aware guides", d: "Guides tagged with the patch they were last checked against." },
]

const STEPS: { n: string; t: string; d: string }[] = [
    { n: "1", t: "Search", d: "Type a name and surname. We look in both regions for you." },
    { n: "2", t: "Explore", d: "Open gear, talents, stats and collections, then click any item to see where it drops." },
    { n: "3", t: "Improve", d: "Run the Upgrade Finder for your spec and go and get the missing pieces." },
]

const css = `
.fw-card{transition:transform .18s ease, border-color .18s ease, background .18s ease}
.fw-card:hover{transform:translateY(-3px);border-color:rgba(232,182,79,.55)!important;background:rgba(255,255,255,.10)!important}
.fw-chip{transition:background .15s ease,border-color .15s ease}
.fw-chip:hover{background:rgba(255,255,255,.14)!important;border-color:rgba(255,255,255,.3)!important}
.fw-go:hover{filter:brightness(1.08);transform:translateY(-1px)}
.fw-in:focus{outline:none;border-color:#E8B64F!important;box-shadow:0 0 0 3px rgba(232,182,79,.25)}
.fw-row:hover{background:rgba(255,255,255,.06)}
`

function Icon({ d, color }: { d: string; color: string }) {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>
            <path d={d} fill={color} />
        </svg>
    )
}

export default function HomeLanding(props: Props) {
    const base = (props.apiUrl || "").replace(/\/$/, "")
    const accent = props.accent || "#E8B64F"
    const [q, setQ] = React.useState("")
    const [region, setRegion] = React.useState<"" | "eu" | "us">("")
    const [top, setTop] = React.useState<any[] | null>(null)

    React.useEffect(() => {
        if (props.part !== "body" || !base) return
        let live = true
        fetch(base + "/api/leaderboard?board=ilvl&region=all&limit=5")
            .then((r) => r.json())
            .then((d) => live && setTop(d && Array.isArray(d.rows) ? d.rows.slice(0, 5) : null))
            .catch(() => live && setTop(null))
        return () => { live = false }
    }, [base, props.part])

    const go = () => {
        const v = q.trim().replace(/\s+/g, "-")
        if (!v) { window.location.href = "/armoury"; return }
        window.location.href = "/armoury?q=" + encodeURIComponent(v) + (region ? "&region=" + region : "")
    }

    const h2: React.CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", color: accent, margin: 0 }
    const h3: React.CSSProperties = { fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 800, letterSpacing: "-0.02em", margin: "6px 0 0", color: "#fff" }
    const card: React.CSSProperties = { background: GLASS, backdropFilter: BLUR, WebkitBackdropFilter: BLUR, border: EDGE, borderRadius: 18, boxShadow: SHADOW }

    if (props.part === "hero") {
        return (
            <div style={{ fontFamily: FONT, color: TEXT, width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
                <style>{css}</style>
                <p style={{ ...h2, margin: 0 }}>WORLD OF WARCRAFT: FOREVER</p>
                <h1 style={{ fontSize: "clamp(34px, 7.4vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.04, margin: 0, color: "#fff", textWrap: "balance" as any }}>
                    Look up any character.<br />See everything.
                </h1>
                <p style={{ fontSize: "clamp(16px, 2.4vw, 19px)", lineHeight: 1.55, color: "#D5D9E0", margin: 0, maxWidth: 640 }}>
                    The community armoury for Forever. Gear, talents, stats and upgrade suggestions for every character, plus a drop database with maps.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6, maxWidth: 680 }}>
                    <input
                        className="fw-in"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") go() }}
                        placeholder="Name Surname"
                        aria-label="Character name"
                        style={{ flex: "1 1 240px", minWidth: 0, height: 54, padding: "0 18px", fontSize: 17, fontFamily: FONT, color: "#fff", background: "rgba(8,10,14,0.62)", backdropFilter: BLUR, WebkitBackdropFilter: BLUR, border: EDGE, borderRadius: 14 }}
                    />
                    <button className="fw-go" onClick={go} style={{ height: 54, padding: "0 28px", fontSize: 16, fontWeight: 700, fontFamily: FONT, color: "#1A1305", background: accent, border: "none", borderRadius: 14, cursor: "pointer", transition: "transform .15s ease, filter .15s ease" }}>
                        Search
                    </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: MUTED, marginRight: 2 }}>Region</span>
                    {([["", "Both"], ["eu", "EU"], ["us", "US"]] as [string, string][]).map(([v, l]) => (
                        <button key={v} className="fw-chip" onClick={() => setRegion(v as any)} style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 999, cursor: "pointer", color: region === v ? "#1A1305" : TEXT, background: region === v ? accent : "rgba(255,255,255,0.08)", border: region === v ? "1px solid " + accent : "1px solid rgba(255,255,255,0.18)" }}>{l}</button>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div style={{ fontFamily: FONT, color: TEXT, width: "100%", display: "flex", flexDirection: "column", gap: 44 }}>
            <style>{css}</style>

            {/* Tools */}
            <section>
                <p style={h2}>EVERYTHING IN ONE PLACE</p>
                <h2 style={h3}>Eight tools, all live</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, marginTop: 18 }}>
                    {TOOLS.map((t) => (
                        <a key={t.t} href={t.href} className="fw-card" style={{ ...card, padding: 20, textDecoration: "none", color: TEXT, display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(232,182,79,0.14)", border: "1px solid rgba(232,182,79,0.3)" }}>
                                    <Icon d={t.g} color={accent} />
                                </div>
                                {t.tag ? <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", padding: "4px 9px", borderRadius: 999, color: "#1A1305", background: accent }}>{t.tag.toUpperCase()}</span> : null}
                            </div>
                            <div style={{ fontSize: 17, fontWeight: 700 }}>{t.t}</div>
                            <div style={{ fontSize: 14, lineHeight: "21px", color: MUTED }}>{t.d}</div>
                            <div style={{ marginTop: "auto", fontSize: 13, fontWeight: 650, color: accent }}>Open &rarr;</div>
                        </a>
                    ))}
                </div>
            </section>

            {/* Top characters */}
            {top && top.length > 0 ? (
                <section>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div>
                            <p style={h2}>LEADERBOARD</p>
                            <h2 style={h3}>Top item levels right now</h2>
                        </div>
                        <a href="/leaderboards" style={{ fontSize: 14, fontWeight: 650, color: accent, textDecoration: "none" }}>Full leaderboards &rarr;</a>
                    </div>
                    <div style={{ ...card, marginTop: 16, overflow: "hidden" }}>
                        {top.map((r: any, i: number) => (
                            <a key={r.region + (r.slug || i)} className="fw-row" href={"/armoury?q=" + encodeURIComponent(r.name + "-" + r.surname) + "&region=" + r.region} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", textDecoration: "none", color: TEXT, borderTop: i ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                                <span style={{ width: 28, fontWeight: 800, color: i < 3 ? accent : MUTED }}>{i + 1}</span>
                                <span style={{ flex: 1, minWidth: 0, fontWeight: 650, color: r.faction && String(r.faction).toUpperCase() === "HORDE" ? "#E5484D" : r.faction && String(r.faction).toUpperCase() === "ALLIANCE" ? "#4C9AFF" : TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name + " " + r.surname}</span>
                                <span style={{ color: MUTED, fontSize: 13 }}>{r.class || ""}</span>
                                <span style={{ color: MUTED, fontSize: 12, textTransform: "uppercase", width: 28 }}>{r.region}</span>
                                <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", width: 46, textAlign: "right" }}>{typeof r.ilvl === "number" ? (Number.isInteger(r.ilvl) ? r.ilvl : r.ilvl.toFixed(1)) : "-"}</span>
                            </a>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* How it works */}
            <section>
                <p style={h2}>HOW IT WORKS</p>
                <h2 style={h3}>From a name to a gear plan</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginTop: 18 }}>
                    {STEPS.map((s) => (
                        <div key={s.n} style={{ ...card, padding: 20, display: "flex", gap: 14 }}>
                            <div style={{ flex: "none", width: 34, height: 34, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#1A1305", background: accent }}>{s.n}</div>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700 }}>{s.t}</div>
                                <div style={{ fontSize: 14, lineHeight: "21px", color: MUTED, marginTop: 4 }}>{s.d}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Discord */}
            <section style={{ ...card, padding: "clamp(20px, 4vw, 32px)", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, rgba(88,101,242,0.22), rgba(255,255,255,0.05))" }}>
                <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                    <p style={h2}>DISCORD</p>
                    <h2 style={{ ...h3, fontSize: "clamp(20px, 3.5vw, 26px)" }}>Take the armoury to your server</h2>
                    <p style={{ margin: "8px 0 0", fontSize: 15, lineHeight: "23px", color: "#C9CEDA" }}>
                        Use /armory and /item in any channel, link your character, and get a sign-in code for writing guides on the site.
                    </p>
                </div>
                <a href="/discord" className="fw-go" style={{ padding: "14px 26px", fontSize: 15, fontWeight: 700, color: "#1A1305", background: accent, borderRadius: 12, textDecoration: "none", transition: "transform .15s ease, filter .15s ease" }}>See the commands</a>
            </section>

            {/* Next */}
            <section>
                <p style={h2}>NEXT UP</p>
                <h2 style={h3}>What we're building next</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, marginTop: 18 }}>
                    {NEXT.map((n) => (
                        <div key={n.t} style={{ borderRadius: 18, padding: 20, border: "1px dashed rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.03)" }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "#E6E8EC" }}>{n.t}</div>
                            <div style={{ fontSize: 14, lineHeight: "21px", color: MUTED, marginTop: 6 }}>{n.d}</div>
                        </div>
                    ))}
                </div>
            </section>

            <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "#6F7785" }}>
                Fan project, not affiliated with Blizzard Entertainment. World of Warcraft and its artwork, including the zone maps, are trademarks and copyright of Blizzard Entertainment. Character data comes from Blizzard's official API; item sources come from forever-db.
            </p>
        </div>
    )
}

HomeLanding.defaultProps = { part: "body", apiUrl: "https://forever-armory-api.jack-taylor1809.workers.dev", accent: "#E8B64F" }

addPropertyControls(HomeLanding, {
    part: { type: ControlType.Enum, title: "Part", options: ["hero", "body"], optionTitles: ["Hero", "Body"], defaultValue: "body" },
    apiUrl: { type: ControlType.String, title: "API URL", defaultValue: "https://forever-armory-api.jack-taylor1809.workers.dev" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#E8B64F" },
})
