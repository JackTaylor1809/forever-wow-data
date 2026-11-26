import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const TEXT = "#F4F5F7"
const MUTED = "#9BA3B0"
const EDGE = "1px solid rgba(255,255,255,0.14)"
const GLASS = "rgba(255,255,255,0.07)"
const BLUR = "blur(18px) saturate(1.4)"
const SHADOW = "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.14)"
const CLASS_COLOURS: Record<string, string> = { Warrior: "#C79C6E", Paladin: "#F58CBA", Hunter: "#ABD473", Rogue: "#FFF569", Priest: "#FFFFFF", Shaman: "#0070DE", Mage: "#69CCF0", Warlock: "#9482C9", Druid: "#FF7D0A" }
const card: React.CSSProperties = { background: GLASS, backdropFilter: BLUR, WebkitBackdropFilter: BLUR, border: EDGE, borderRadius: 18, boxShadow: SHADOW }

export default function PopularBuilds(props: { apiUrl: string; accent: string; region: string }) {
    const base = (props.apiUrl || "").replace(/\/$/, "")
    const accent = props.accent || "#E8B64F"
    const [classes, setClasses] = React.useState<any[]>([])
    const [cid, setCid] = React.useState<number | null>(null)
    const [min, setMin] = React.useState(10)
    const [data, setData] = React.useState<any>(null)
    const [err, setErr] = React.useState("")

    React.useEffect(() => {
        if (!base) return
        fetch(base + "/api/talents?region=" + (props.region || "us")).then((r) => r.json()).then((d) => { if (d.classes) { setClasses(d.classes); setCid((c) => c ?? d.classes[0]?.id ?? null) } }).catch(() => setErr("Could not reach the API."))
    }, [base])
    React.useEffect(() => {
        if (!base || cid == null) return
        let live = true
        setData(null); setErr("")
        fetch(base + "/api/builds?class=" + cid + "&min=" + min).then((r) => r.json()).then((d) => { if (!live) return; if (d.error) setErr(d.error); else setData(d) }).catch(() => live && setErr("Could not reach the API."))
        return () => { live = false }
    }, [base, cid, min])

    if (!base) return <div style={{ fontFamily: FONT, color: MUTED, padding: 24 }}>Set the API URL on this component.</div>
    const cls = classes.find((c) => c.id === cid)
    const col = (cls && CLASS_COLOURS[cls.name]) || accent
    const chip = (on: boolean, c: string): React.CSSProperties => ({ height: 34, padding: "0 14px", borderRadius: 999, border: "1px solid " + (on ? c : "rgba(255,255,255,0.16)"), background: on ? "rgba(255,255,255,0.1)" : "transparent", color: on ? c : TEXT, fontFamily: FONT, fontSize: 13, fontWeight: 650, cursor: "pointer" })

    return (
        <div style={{ fontFamily: FONT, color: TEXT, width: "100%", display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
            <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: accent }}>TOOLS</div>
                <h1 style={{ margin: "6px 0 6px", fontSize: 44, lineHeight: "1.05em", letterSpacing: "-0.03em", fontWeight: 800 }}>Popular Builds</h1>
                <div style={{ fontSize: 16, color: MUTED, maxWidth: 640 }}>What players are really running. Built from the talents of real characters we have scanned, not opinions.</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {classes.map((c) => <button key={c.id} onClick={() => setCid(c.id)} style={chip(c.id === cid, CLASS_COLOURS[c.name] || accent)}>{c.name}</button>)}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: MUTED }}>Players at level</span>
                {[[10, "10+"], [30, "30+"], [50, "50+"], [60, "60"]].map(([v, l]) => <button key={v} onClick={() => setMin(v as number)} style={chip(min === v, accent)}>{l}</button>)}
            </div>
            {err ? <div style={{ ...card, padding: 20, color: MUTED, fontSize: 14 }}>{err}</div> : null}
            {!data && !err ? <div style={{ color: MUTED, fontSize: 14 }}>Loading builds...</div> : null}
            {data ? (
                <>
                    <div style={{ fontSize: 13, color: MUTED }}>{"Based on " + data.sample + " " + (cls?.name || "") + " players with talent data. This grows as more characters are scanned."}</div>
                    {!data.sample ? <div style={{ ...card, padding: 22, color: MUTED, fontSize: 14, lineHeight: "22px" }}>No talent data for this class at this level yet. Characters are being scanned in the background, so check back soon.</div> : null}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "stretch" }}>
                        {data.specs.map((s: any) => (
                            <div key={s.name} style={{ ...card, padding: 18, flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: col }}>{s.name}</div>
                                    <div style={{ fontSize: 13, color: MUTED }}>{s.share + "% of players · " + s.players}</div>
                                </div>
                                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.1)" }}><div style={{ width: s.share + "%", height: 6, borderRadius: 3, background: col }} /></div>
                                <div style={{ fontSize: 12, fontWeight: 750, letterSpacing: "0.08em", color: accent, marginTop: 4 }}>MOST PICKED TALENTS</div>
                                {s.top.map((t: any) => (
                                    <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                                        <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                                        <div style={{ color: MUTED, fontSize: 12 }}>{t.avgRank + "/" + t.max}</div>
                                        <div style={{ width: 90, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.1)", flex: "none" }}><div style={{ width: t.pct + "%", height: 6, borderRadius: 3, background: accent }} /></div>
                                        <div style={{ width: 38, textAlign: "right", fontWeight: 750, fontVariantNumeric: "tabular-nums" }}>{t.pct + "%"}</div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    {data.common.length ? (
                        <div style={{ ...card, padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ fontSize: 12, fontWeight: 750, letterSpacing: "0.08em", color: accent }}>{"MOST COMMON POINT SPLITS (" + data.trees.join(" / ") + ")"}</div>
                            {data.common.map((c: any) => <div key={c.split} style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}><span style={{ fontWeight: 750 }}>{c.split}</span><span style={{ color: MUTED }}>{c.players + (c.players === 1 ? " player" : " players")}</span></div>)}
                        </div>
                    ) : null}
                    {data.top.length ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ fontSize: 12, fontWeight: 750, letterSpacing: "0.08em", color: accent }}>BUILDS OF THE HIGHEST ITEM LEVEL PLAYERS</div>
                            {data.top.map((p: any) => (
                                <div key={p.region + p.slug} style={{ ...card, padding: "14px 16px", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                                    <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                                        <div style={{ fontSize: 16, fontWeight: 800 }}>{p.name}</div>
                                        <div style={{ fontSize: 13, color: MUTED }}>{p.spec + " · level " + p.level + " · ilvl " + p.ilvl + " · " + p.region.toUpperCase()}</div>
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 750 }}>{p.split}</div>
                                    <a href={"/talents#c=" + p.c + "&l=" + Math.max(10, Math.min(60, p.level)) + "&b=" + p.b} style={{ fontSize: 13, fontWeight: 700, color: accent, textDecoration: "none", border: "1px solid " + accent, borderRadius: 9, padding: "7px 12px" }}>Open in planner</a>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    )
}

PopularBuilds.defaultProps = { apiUrl: "", accent: "#E8B64F", region: "us" }
addPropertyControls(PopularBuilds, {
    apiUrl: { type: ControlType.String, title: "API URL", defaultValue: "" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#E8B64F" },
    region: { type: ControlType.String, title: "Region", defaultValue: "us" },
})
