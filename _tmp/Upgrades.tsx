import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const TEXT = "#F4F5F7"
const MUTED = "#9BA3B0"
const EDGE = "1px solid rgba(255,255,255,0.14)"
const GLASS = "rgba(255,255,255,0.07)"
const BLUR = "blur(18px) saturate(1.4)"
const SHADOW = "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.14)"
const QUALITY: Record<string, string> = { POOR: "#9D9D9D", COMMON: "#FFFFFF", UNCOMMON: "#1EFF00", RARE: "#4C9AFF", EPIC: "#C77DFF", LEGENDARY: "#FF8000", ARTIFACT: "#E6CC80" }
const qc = (q?: string | null) => (q && QUALITY[q.toUpperCase()]) || TEXT
const card: React.CSSProperties = { background: GLASS, backdropFilter: BLUR, WebkitBackdropFilter: BLUR, border: EDGE, borderRadius: 18, boxShadow: SHADOW }
const input: React.CSSProperties = { flex: "1 1 220px", minWidth: 0, boxSizing: "border-box", background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, padding: "11px 14px", color: TEXT, fontFamily: FONT, fontSize: 15, outline: "none" }
const store = {
    get: (k: string) => { try { return window.localStorage.getItem(k) || "" } catch (e) { return "" } },
    set: (k: string, v: string) => { try { window.localStorage.setItem(k, v) } catch (e) {} },
}
const when = (d: string) => { try { return new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) } catch (e) { return d } }
const sourceText = (s: any) => {
    if (!s) return "Source not known yet"
    const pct = s.chance != null ? " (" + (s.chance < 1 ? "<1" : Math.round(s.chance * 10) / 10) + "%)" : ""
    const where = s.zone || s.map ? " in " + (s.zone || s.map) : ""
    if (s.type === "vendor") return "Sold by " + s.name + where
    if (s.type === "object") return "Found in " + s.name + where + pct
    return "Drops from " + s.name + pct + where
}

function Chip(p: { on: boolean; accent: string; onClick: () => void; children: any }) {
    return <button onClick={p.onClick} style={{ height: 34, padding: "0 14px", borderRadius: 999, border: "1px solid " + (p.on ? p.accent : "rgba(255,255,255,0.16)"), background: p.on ? "rgba(255,255,255,0.1)" : "transparent", color: p.on ? p.accent : TEXT, fontFamily: FONT, fontSize: 13, fontWeight: 650, cursor: "pointer" }}>{p.children}</button>
}
function Icon(p: { src?: string | null; size: number }) {
    return p.src ? <img src={p.src} width={p.size} height={p.size} style={{ display: "block", borderRadius: 8, flex: "none" }} /> : <div style={{ width: p.size, height: p.size, borderRadius: 8, background: "rgba(255,255,255,0.08)", flex: "none" }} />
}

function Chart(p: { points: any[]; accent: string }) {
    const pts = p.points.filter((x) => typeof x.ilvl === "number")
    if (pts.length < 2) return null
    const W = 640, H = 160, pad = 28
    const lo = Math.min(...pts.map((x) => x.ilvl)), hi = Math.max(...pts.map((x) => x.ilvl))
    const span = Math.max(hi - lo, 1)
    const X = (i: number) => pad + (i * (W - pad * 2)) / (pts.length - 1)
    const Y = (v: number) => H - pad - ((v - lo) / span) * (H - pad * 2)
    return (
        <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", display: "block" }}>
            <polyline fill="none" stroke={p.accent} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" points={pts.map((x, i) => X(i) + "," + Y(x.ilvl)).join(" ")} />
            {pts.map((x, i) => <circle key={i} cx={X(i)} cy={Y(x.ilvl)} r={4} fill={p.accent} />)}
            <text x={pad} y={14} fill={MUTED} fontSize={12} fontFamily={FONT}>{"Item level " + lo + " to " + hi}</text>
            <text x={pad} y={H - 6} fill={MUTED} fontSize={12} fontFamily={FONT}>{when(pts[0].day)}</text>
            <text x={W - pad} y={H - 6} fill={MUTED} fontSize={12} fontFamily={FONT} textAnchor="end">{when(pts[pts.length - 1].day)}</text>
        </svg>
    )
}

export default function Upgrades(props: { apiUrl: string; accent: string }) {
    const base = (props.apiUrl || "").replace(/\/$/, "")
    const accent = props.accent || "#E8B64F"
    const [q, setQ] = React.useState("")
    const [region, setRegion] = React.useState("")
    const [tab, setTab] = React.useState<"up" | "prog">("up")
    const [data, setData] = React.useState<any>(null)
    const [hist, setHist] = React.useState<any>(null)
    const [err, setErr] = React.useState("")
    const [busy, setBusy] = React.useState(false)

    const go = async (name: string, reg: string) => {
        const n = name.trim()
        if (n.length < 3) return
        setBusy(true); setErr(""); setData(null); setHist(null)
        store.set("fw_upg_char", n); store.set("fw_upg_region", reg)
        try {
            const qs = "q=" + encodeURIComponent(n) + (reg ? "&region=" + reg : "")
            const r = await fetch(base + "/api/upgrades?" + qs)
            const d = await r.json()
            if (!r.ok) { setErr(d.error || "Could not look that character up."); setBusy(false); return }
            setData(d)
            fetch(base + "/api/history?" + qs).then((x) => x.json()).then(setHist).catch(() => {})
        } catch (e) { setErr("Could not reach the API.") }
        setBusy(false)
    }
    React.useEffect(() => {
        const c = store.get("fw_upg_char"), r = store.get("fw_upg_region")
        if (c) { setQ(c); setRegion(r); go(c, r) }
    }, [])

    if (!base) return <div style={{ fontFamily: FONT, color: MUTED, padding: 24 }}>Set the API URL on this component.</div>
    const withUps = data ? data.slots.filter((s: any) => s.upgrades.length) : []
    const none = data ? data.slots.filter((s: any) => !s.upgrades.length) : []

    return (
        <div style={{ fontFamily: FONT, color: TEXT, width: "100%", display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
            <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: accent }}>TOOLS</div>
                <h1 style={{ margin: "6px 0 6px", fontSize: 44, lineHeight: "1.05em", letterSpacing: "-0.03em", fontWeight: 800 }}>Upgrade Finder</h1>
                <div style={{ fontSize: 16, color: MUTED, maxWidth: 640 }}>See which items players of your class are wearing that beat your gear, and exactly where they drop. Then watch your progress over time.</div>
            </div>
            <div style={{ ...card, padding: 16, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") go(q, region) }} placeholder="Character name, e.g. Jt Huntz" style={input} />
                <Chip on={region === ""} accent={accent} onClick={() => setRegion("")}>Any region</Chip>
                <Chip on={region === "eu"} accent={accent} onClick={() => setRegion("eu")}>EU</Chip>
                <Chip on={region === "us"} accent={accent} onClick={() => setRegion("us")}>US</Chip>
                <button onClick={() => go(q, region)} disabled={busy} style={{ height: 40, padding: "0 20px", borderRadius: 10, border: "none", background: accent, color: "#1A1305", fontFamily: FONT, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>{busy ? "Looking..." : "Find upgrades"}</button>
            </div>
            {err ? <div style={{ ...card, padding: 18, color: "#FF8A8A", fontSize: 14 }}>{err}</div> : null}
            {data ? (
                <>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>{data.character.name}</div>
                        <div style={{ fontSize: 14, color: MUTED }}>{"Level " + data.character.level + " " + data.character.className + " · " + data.character.region.toUpperCase()}</div>
                        <div style={{ flex: 1 }} />
                        <Chip on={tab === "up"} accent={accent} onClick={() => setTab("up")}>Upgrades</Chip>
                        <Chip on={tab === "prog"} accent={accent} onClick={() => setTab("prog")}>Progress</Chip>
                    </div>
                    {tab === "up" ? (
                        <>
                            <div style={{ fontSize: 13, color: MUTED, lineHeight: "20px" }}>
                                {data.basis.people > 0 ? "Suggestions are items that " + data.basis.people + " tracked " + data.character.className + " players wear, with a higher item level than yours. It grows as more characters are scanned." : "We haven't scanned any " + data.character.className + " players yet, so there are no suggestions. Check back soon."}
                            </div>
                            {withUps.map((s: any) => (
                                <div key={s.slot} style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                        <div style={{ fontSize: 12, fontWeight: 750, letterSpacing: "0.08em", textTransform: "uppercase", color: accent, minWidth: 70 }}>{s.label}</div>
                                        <Icon src={s.equipped.icon} size={32} />
                                        <div style={{ fontSize: 14, fontWeight: 650, color: qc(s.equipped.quality) }}>{s.equipped.name}</div>
                                        <div style={{ fontSize: 13, color: MUTED }}>{"ilvl " + (s.equipped.ilvl ?? "?")}</div>
                                    </div>
                                    {s.upgrades.map((u: any) => (
                                        <a key={u.id} href={"/item?id=" + u.id} style={{ display: "flex", gap: 12, alignItems: "center", textDecoration: "none", color: TEXT, background: "rgba(92,255,138,0.06)", border: "1px solid rgba(92,255,138,0.25)", borderRadius: 12, padding: "10px 12px" }}>
                                            <Icon src={u.icon} size={40} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 15, fontWeight: 750, color: qc(u.quality) }}>{u.name}</div>
                                                <div style={{ fontSize: 13, color: "#D6DAE2", marginTop: 2 }}>{sourceText(u.source)}</div>
                                            </div>
                                            <div style={{ textAlign: "right", flex: "none" }}>
                                                <div style={{ fontSize: 15, fontWeight: 800, color: "#5CFF8A" }}>{"+" + (u.ilvl - (s.equipped.ilvl ?? 0))}</div>
                                                <div style={{ fontSize: 12, color: MUTED }}>{"ilvl " + u.ilvl + " · " + u.worn + " wear it"}</div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ))}
                            {data.basis.people > 0 && !withUps.length ? <div style={{ ...card, padding: 20, color: MUTED, fontSize: 14 }}>No better items found for this character yet.</div> : null}
                            {none.length && withUps.length ? <div style={{ fontSize: 13, color: MUTED }}>{"No known upgrades for: " + none.map((s: any) => s.label).join(", ")}</div> : null}
                        </>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {!hist ? <div style={{ color: MUTED, fontSize: 14 }}>Loading progress...</div> : null}
                            {hist && hist.found ? (
                                <>
                                    <div style={{ ...card, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                                        <div style={{ fontSize: 13, color: MUTED }}>{"Tracking since " + when(hist.since) + " · " + hist.points.length + (hist.points.length === 1 ? " day" : " days") + " recorded"}</div>
                                        <Chart points={hist.points} accent={accent} />
                                        {hist.points.length < 2 ? <div style={{ fontSize: 14, color: MUTED, lineHeight: "22px" }}>Tracking started today. Come back tomorrow and your item level graph and gear timeline will start to fill in.</div> : null}
                                    </div>
                                    {hist.changes.map((c: any) => (
                                        <div key={c.day} style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                                            <div style={{ fontSize: 12, fontWeight: 750, letterSpacing: "0.08em", color: accent }}>{when(c.day).toUpperCase()}</div>
                                            {c.gained.map((g: any) => <a key={"g" + g.id} href={"/item?id=" + g.id} style={{ display: "flex", gap: 10, alignItems: "center", textDecoration: "none", color: qc(g.quality), fontSize: 14, fontWeight: 650 }}><span style={{ color: "#5CFF8A" }}>+</span><Icon src={g.icon} size={26} />{g.name}<span style={{ color: MUTED, fontWeight: 500 }}>{g.slot}</span></a>)}
                                            {c.lost.map((g: any) => <div key={"l" + g.id} style={{ fontSize: 13, color: MUTED }}>{"− " + g.name + " (" + g.slot + ")"}</div>)}
                                        </div>
                                    ))}
                                    {hist.points.length >= 2 && !hist.changes.length ? <div style={{ fontSize: 14, color: MUTED }}>No gear changes recorded yet.</div> : null}
                                </>
                            ) : null}
                            {hist && !hist.found ? <div style={{ ...card, padding: 20, color: MUTED, fontSize: 14 }}>Tracking has just started for this character.</div> : null}
                        </div>
                    )}
                </>
            ) : null}
        </div>
    )
}

Upgrades.defaultProps = { apiUrl: "", accent: "#E8B64F" }
addPropertyControls(Upgrades, {
    apiUrl: { type: ControlType.String, title: "API URL", defaultValue: "" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#E8B64F" },
})
