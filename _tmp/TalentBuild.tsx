import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

// A talent tree you can edit (guide editor) or just read (guide page). Build string format matches the Talent Planner.
const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const TEXT = "#F4F5F7"
const MUTED = "#9BA3B0"
const EDGE = "1px solid rgba(255,255,255,0.14)"
const CELL = 52
const GAP = 18
const ROWS_PER_TIER = 5

type Node = { id: number; row: number; col: number; lockedBy: any[]; unlocks: any[]; ranks: any[]; icon: string | null }
type Tree = { specId: number; name: string; nodes: Node[] }

const idOf = (x: any) => (typeof x === "number" ? x : x && typeof x === "object" ? x.id ?? x.node_id ?? null : null)
const sortNodes = (t: Tree) => [...t.nodes].sort((a, b) => a.row - b.row || a.col - b.col)
const cache: Record<string, any> = {}

function treeValid(tree: Tree, alloc: Record<number, number>): boolean {
    const byId: Record<number, Node> = {}
    tree.nodes.forEach((n) => (byId[n.id] = n))
    const minRow = Math.min(...tree.nodes.map((n) => n.row))
    for (const n of tree.nodes) {
        const r = alloc[n.id] || 0
        if (r <= 0) continue
        if (r > n.ranks.length) return false
        let above = 0
        for (const m of tree.nodes) if (m.row < n.row) above += alloc[m.id] || 0
        if (above < ROWS_PER_TIER * (n.row - minRow)) return false
        for (const l of n.lockedBy || []) {
            const p = byId[idOf(l) as number]
            if (p && (alloc[p.id] || 0) < p.ranks.length) return false
        }
    }
    return true
}

export const parseBuild = (trees: Tree[], build: string) => {
    const parts = (build || "").split(".")
    return trees.map((t, i) => {
        const a: Record<number, number> = {}
        const s = parts[i] || ""
        sortNodes(t).forEach((n, k) => { const v = parseInt(s[k] || "0", 10); if (v > 0) a[n.id] = Math.min(v, n.ranks.length) })
        return a
    })
}

type Props = { apiUrl: string; region: string; classId: number; level: number; build: string; readOnly?: boolean; focusSpec?: string; accent: string; onChange?: (build: string, level: number) => void }

export default function TalentBuild(props: Props) {
    const base = (props.apiUrl || "").replace(/\/$/, "")
    const region = props.region || "us"
    const accent = props.accent || "#E8B64F"
    const ro = !!props.readOnly
    const [trees, setTrees] = React.useState<Tree[] | null>(null)
    const [err, setErr] = React.useState("")
    const [allocs, setAllocs] = React.useState<Record<number, number>[]>([])
    const [level, setLevel] = React.useState(props.level || 60)
    const [hover, setHover] = React.useState<{ n: Node; t: number; x: number; y: number } | null>(null)
    const [only, setOnly] = React.useState<number | null>(null)

    React.useEffect(() => {
        if (!base || props.classId == null) return
        let live = true
        const key = base + "|" + region + "|" + props.classId
        const apply = (d: any) => {
            if (!live) return
            if (!d.trees || !d.trees.length) { setErr(d.error || "No talent data for this class yet."); return }
            let ts: Tree[] = d.trees
            if (props.focusSpec) ts = [...ts].sort((a, b) => (b.name === props.focusSpec ? 1 : 0) - (a.name === props.focusSpec ? 1 : 0))
            setTrees(ts)
            const parsed = parseBuild(d.trees, props.build) // build strings are always stored in the API's tree order
            const byId: Record<number, Record<number, number>> = {}
            d.trees.forEach((t: Tree, i: number) => (byId[t.specId] = parsed[i]))
            setAllocs(ts.map((t) => byId[t.specId] || {}))
            setErr("")
        }
        if (cache[key]) { apply(cache[key]); return }
        fetch(base + "/api/talents?region=" + region + "&class=" + props.classId).then((r) => r.json()).then((d) => { cache[key] = d; apply(d) }).catch(() => live && setErr("Could not reach the API."))
        return () => { live = false }
    }, [base, region, props.classId])

    // Keep the read-only view in step with the build it is given.
    React.useEffect(() => {
        if (!ro || !trees) return
        const key = base + "|" + region + "|" + props.classId
        const order: Tree[] = cache[key]?.trees || trees
        const parsed = parseBuild(order, props.build)
        const byId: Record<number, Record<number, number>> = {}
        order.forEach((t, i) => (byId[t.specId] = parsed[i]))
        setAllocs(trees.map((t) => byId[t.specId] || {}))
        setLevel(props.level || 60)
    }, [props.build, props.level, trees, ro])

    const apiOrder = () => {
        const key = base + "|" + region + "|" + props.classId
        return cache[key]?.trees || trees || []
    }
    const encode = (al: Record<number, number>[]) => {
        if (!trees) return ""
        const byId: Record<number, Record<number, number>> = {}
        trees.forEach((t, i) => (byId[t.specId] = al[i] || {}))
        return apiOrder().map((t: Tree) => sortNodes(t).map((n) => (byId[t.specId] || {})[n.id] || 0).join("")).join(".")
    }

    const cap = Math.max(0, level - 9)
    const spent = allocs.reduce((a, t) => a + Object.values(t).reduce((x, y) => x + y, 0), 0)
    const left = cap - spent

    const change = (ti: number, n: Node, delta: number) => {
        if (ro || !trees) return
        const t = trees[ti]
        const cur = allocs[ti][n.id] || 0
        const next = cur + delta
        if (next < 0 || next > n.ranks.length) return
        if (delta > 0 && left <= 0) return
        const cand = { ...allocs[ti] }
        if (next === 0) delete cand[n.id]; else cand[n.id] = next
        if (!treeValid(t, cand)) return
        const all = allocs.slice(); all[ti] = cand
        setAllocs(all)
        props.onChange && props.onChange(encode(all), level)
    }
    const reset = () => { const all = allocs.map(() => ({})); setAllocs(all); props.onChange && props.onChange(encode(all), level) }

    const smallBtn: React.CSSProperties = { height: 30, padding: "0 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: TEXT, fontFamily: FONT, fontSize: 12, fontWeight: 650, cursor: "pointer" }

    if (!base) return <div style={{ fontFamily: FONT, color: MUTED, padding: 12 }}>Set the API URL.</div>
    if (err) return <div style={{ fontFamily: FONT, color: MUTED, fontSize: 13, padding: 12 }}>{err}</div>
    if (!trees) return <div style={{ fontFamily: FONT, color: MUTED, fontSize: 13, padding: 12 }}>Loading talents...</div>

    const renderTree = (t: Tree, ti: number) => {
        const minRow = Math.min(...t.nodes.map((n) => n.row)), minCol = Math.min(...t.nodes.map((n) => n.col))
        const maxRow = Math.max(...t.nodes.map((n) => n.row)), maxCol = Math.max(...t.nodes.map((n) => n.col))
        const W = (maxCol - minCol) * (CELL + GAP) + CELL, H = (maxRow - minRow) * (CELL + GAP) + CELL
        const px = (n: Node) => (n.col - minCol) * (CELL + GAP), py = (n: Node) => (n.row - minRow) * (CELL + GAP)
        const a = allocs[ti] || {}
        const inTree = Object.values(a).reduce((x, y) => x + y, 0)
        const byId: Record<number, Node> = {}
        t.nodes.forEach((n) => (byId[n.id] = n))
        const above = (n: Node) => t.nodes.reduce((s, m) => s + (m.row < n.row ? a[m.id] || 0 : 0), 0)
        const lines: any[] = []
        t.nodes.forEach((n) => (n.lockedBy || []).forEach((l) => {
            const p = byId[idOf(l) as number]; if (!p) return
            const done = (a[p.id] || 0) >= p.ranks.length
            lines.push(<line key={p.id + "-" + n.id} x1={px(p) + CELL / 2} y1={py(p) + CELL / 2} x2={px(n) + CELL / 2} y2={py(n) + CELL / 2} stroke={done ? "#5CFF8A" : "rgba(255,255,255,0.22)"} strokeWidth={4} strokeLinecap="round" />)
        }))
        return (
            <div key={t.specId} style={{ background: "rgba(255,255,255,0.05)", border: EDGE, borderRadius: 14, padding: "14px 14px 20px", display: "flex", flexDirection: "column", gap: 10, alignItems: "center", flex: "1 1 300px", minWidth: 0, overflow: "auto" }}>
                <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 15, fontWeight: 750, color: t.name === props.focusSpec ? accent : TEXT }}>{t.name}</div>
                    <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: inTree ? TEXT : MUTED }}>{inTree}</span>
                </div>
                <div style={{ position: "relative", width: W, height: H, flex: "none" }}>
                    <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{lines}</svg>
                    {t.nodes.map((n) => {
                        const r = a[n.id] || 0
                        const max = n.ranks.length
                        const unlocked = above(n) >= ROWS_PER_TIER * (n.row - minRow) && (n.lockedBy || []).every((l) => { const p = byId[idOf(l) as number]; return !p || (a[p.id] || 0) >= p.ranks.length })
                        const lit = r > 0
                        const full = r >= max
                        const border = full ? "#FFD100" : lit ? "#5CFF8A" : !ro && unlocked ? "rgba(92,255,138,0.6)" : "rgba(255,255,255,0.14)"
                        return (
                            <div key={n.id}
                                onClick={() => change(ti, n, 1)}
                                onContextMenu={(e) => { if (ro) return; e.preventDefault(); change(ti, n, -1) }}
                                onMouseEnter={(e) => { const b = (e.currentTarget as HTMLElement).getBoundingClientRect(); setHover({ n, t: ti, x: b.left + b.width / 2, y: b.top }) }}
                                onMouseLeave={() => setHover(null)}
                                style={{ position: "absolute", left: px(n), top: py(n), width: CELL, height: CELL, borderRadius: 11, cursor: ro ? "default" : "pointer", border: "2px solid " + border, background: "rgba(0,0,0,0.45)", boxShadow: full ? "0 0 12px rgba(255,209,0,0.35)" : lit ? "0 0 10px rgba(92,255,138,0.3)" : "none", userSelect: "none", WebkitUserSelect: "none" }}>
                                <div style={{ width: "100%", height: "100%", borderRadius: 9, overflow: "hidden", filter: lit || (!ro && unlocked) ? "none" : "grayscale(1) brightness(0.5)", opacity: lit ? 1 : ro ? 0.55 : 0.85 }}>
                                    {n.icon ? <img src={n.icon} width={CELL} height={CELL} draggable={false} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 16, fontWeight: 800 }}>{(n.ranks[0]?.name || "?").charAt(0)}</div>}
                                </div>
                                {lit || !ro ? <div style={{ position: "absolute", right: -7, bottom: -8, minWidth: 22, height: 19, padding: "0 5px", boxSizing: "border-box", borderRadius: 10, background: "#0B0E14", border: "1px solid " + border, color: full ? "#FFD100" : lit ? "#5CFF8A" : MUTED, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontVariantNumeric: "tabular-nums" }}>{r + "/" + max}</div> : null}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const tip = hover ? (() => {
        const n = hover.n
        const r = (allocs[hover.t] || {})[n.id] || 0
        const max = n.ranks.length
        const shown = n.ranks[Math.max(0, Math.min(r > 0 ? r - 1 : 0, max - 1))]
        const left0 = Math.min(Math.max(hover.x, 160), (typeof window !== "undefined" ? window.innerWidth : 1000) - 160)
        return (
            <div style={{ position: "fixed", left: left0, top: Math.max(hover.y - 8, 150), transform: "translate(-50%, -100%)", width: 290, zIndex: 50, pointerEvents: "none", background: "rgba(12,15,22,0.97)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "11px 13px", boxShadow: "0 12px 40px rgba(0,0,0,0.6)", fontFamily: FONT }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#FFD100" }}>{shown?.name || "Talent"}</div>
                <div style={{ fontSize: 12, color: MUTED, margin: "2px 0 6px" }}>{"Rank " + r + "/" + max}</div>
                <div style={{ fontSize: 13, lineHeight: "18px", color: "#FFD100" }}>{shown?.desc}</div>
                {!ro ? <div style={{ marginTop: 8, fontSize: 11, color: MUTED }}>Click to add a point. Right-click to remove.</div> : null}
            </div>
        )
    })() : null

    const shownTrees = trees.map((t, i) => ({ t, i })).filter((x) => only == null || x.i === only)
    return (
        <div style={{ fontFamily: FONT, color: TEXT, width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 18px" }}>
                {!ro ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: MUTED }}>Level</span>
                        <input type="range" min={10} max={60} value={level} onChange={(e) => { const l = parseInt(e.target.value, 10); if (spent > l - 9) return; setLevel(l); props.onChange && props.onChange(encode(allocs), l) }} style={{ width: 120, accentColor: accent }} />
                        <span style={{ fontSize: 14, fontWeight: 800, minWidth: 22 }}>{level}</span>
                    </div>
                ) : <span style={{ fontSize: 13, color: MUTED }}>{"Level " + level + " build"}</span>}
                <span style={{ fontSize: 13 }}><span style={{ color: MUTED }}>{ro ? "Points " : "Points left "}</span><span style={{ fontWeight: 800, color: !ro && left > 0 ? accent : TEXT }}>{ro ? spent : left}</span>{!ro ? <span style={{ color: MUTED }}>{" / " + cap}</span> : null}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{allocs.map((a) => Object.values(a).reduce((x, y) => x + y, 0)).join(" / ")}</span>
                <div style={{ flex: 1 }} />
                {trees.length > 1 ? trees.map((t, i) => <button key={t.specId} onClick={() => setOnly(only === i ? null : i)} style={{ ...smallBtn, borderColor: only === i ? accent : "rgba(255,255,255,0.2)", color: only === i ? accent : TEXT }}>{only === i ? "Show all" : "Only " + t.name}</button>).filter((_, i) => only == null || only === i) : null}
                {!ro ? <button onClick={reset} style={smallBtn}>Reset</button> : null}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "stretch" }}>{shownTrees.map((x) => renderTree(x.t, x.i))}</div>
            {tip}
        </div>
    )
}

TalentBuild.defaultProps = { apiUrl: "", region: "us", classId: 1, level: 60, build: "", readOnly: false, focusSpec: "", accent: "#E8B64F" }

addPropertyControls(TalentBuild, {
    apiUrl: { type: ControlType.String, title: "API URL", defaultValue: "" },
    region: { type: ControlType.String, title: "Region", defaultValue: "us" },
    classId: { type: ControlType.Number, title: "Class ID", defaultValue: 1 },
    level: { type: ControlType.Number, title: "Level", defaultValue: 60 },
    build: { type: ControlType.String, title: "Build", defaultValue: "" },
    readOnly: { type: ControlType.Boolean, title: "Read only", defaultValue: false },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#E8B64F" },
})
