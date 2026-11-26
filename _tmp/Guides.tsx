import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import TalentBuild from "./TalentBuild.js"

const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const TEXT = "#F4F5F7"
const MUTED = "#9BA3B0"
const EDGE = "1px solid rgba(255,255,255,0.14)"
const GLASS = "rgba(255,255,255,0.07)"
const BLUR = "blur(18px) saturate(1.4)"
const SHADOW = "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.14)"
const CLASS_COLOURS: Record<string, string> = { Warrior: "#C79C6E", Paladin: "#F58CBA", Hunter: "#ABD473", Rogue: "#FFF569", Priest: "#FFFFFF", Shaman: "#0070DE", Mage: "#69CCF0", Warlock: "#9482C9", Druid: "#FF7D0A" }
const QUALITY: Record<string, string> = { POOR: "#9D9D9D", COMMON: "#FFFFFF", UNCOMMON: "#1EFF00", RARE: "#4C9AFF", EPIC: "#C77DFF", LEGENDARY: "#FF8000", ARTIFACT: "#E6CC80" }
const KINDS: [string, string][] = [["leveling", "Leveling"], ["dungeons", "Dungeons"], ["pvp", "PvP"], ["raids", "Raids"], ["general", "General"]]
const kindName = (k: string) => (KINDS.find((x) => x[0] === k) || [k, k])[1]
const BLOCKS: [string, string][] = [["h", "Heading"], ["p", "Text"], ["tip", "Tip"], ["build", "Talent build"], ["items", "Item list"]]
const STATUS: Record<string, [string, string]> = { pending: ["Waiting for approval", "#E8B64F"], published: ["Published", "#5CFF8A"], rejected: ["Rejected", "#FF6B6B"], hidden: ["Taken down", "#FF6B6B"] }

const specCache: Record<string, string[]> = {}
const uid = () => Math.random().toString(36).slice(2, 9)
const when = (t: number) => { try { return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) } catch (e) { return "" } }
const store = {
    get: (k: string) => { try { return window.localStorage.getItem(k) || "" } catch (e) { return "" } },
    set: (k: string, v: string) => { try { if (v) window.localStorage.setItem(k, v); else window.localStorage.removeItem(k) } catch (e) {} },
}

const card: React.CSSProperties = { background: GLASS, backdropFilter: BLUR, WebkitBackdropFilter: BLUR, border: EDGE, borderRadius: 18, boxShadow: SHADOW }
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, padding: "10px 12px", color: TEXT, fontFamily: FONT, fontSize: 14, outline: "none" }

function Chip(p: { on: boolean; col: string; onClick: () => void; children: any }) {
    return <button onClick={p.onClick} style={{ height: 34, padding: "0 14px", borderRadius: 999, border: "1px solid " + (p.on ? p.col : "rgba(255,255,255,0.16)"), background: p.on ? "rgba(255,255,255,0.1)" : "transparent", color: p.on ? p.col : TEXT, fontFamily: FONT, fontSize: 13, fontWeight: 650, cursor: "pointer" }}>{p.children}</button>
}
function Btn(p: { onClick: () => void; children: any; primary?: boolean; danger?: boolean; accent: string; disabled?: boolean }) {
    return <button disabled={p.disabled} onClick={p.onClick} style={{ height: 36, padding: "0 16px", borderRadius: 10, border: "1px solid " + (p.primary ? p.accent : p.danger ? "#FF6B6B" : "rgba(255,255,255,0.2)"), background: p.primary ? p.accent : "transparent", color: p.primary ? "#1A1305" : p.danger ? "#FF6B6B" : TEXT, fontFamily: FONT, fontSize: 13, fontWeight: 700, cursor: p.disabled ? "default" : "pointer", opacity: p.disabled ? 0.5 : 1 }}>{p.children}</button>
}
function Title(p: { g: any; size: number; accent: string }) {
    const g = p.g
    const col = CLASS_COLOURS[g.className] || p.accent
    return (
        <span style={{ fontSize: p.size, fontWeight: 800, lineHeight: "1.25em", letterSpacing: "-0.01em" }}>
            <span style={{ color: p.accent }}>{g.author}</span>
            <span style={{ color: MUTED }}>{" · "}</span>
            <span style={{ color: col }}>{g.className}</span>
            <span style={{ color: MUTED }}>{" · "}</span>
            <span>{g.spec}</span>
            <span style={{ color: MUTED }}>{" — "}</span>
            <span>{g.title}</span>
        </span>
    )
}
function Tag(p: { children: any; col?: string }) {
    return <span style={{ fontSize: 11, fontWeight: 750, letterSpacing: "0.06em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 6, border: "1px solid " + (p.col || "rgba(255,255,255,0.2)"), color: p.col || MUTED }}>{p.children}</span>
}

// ---- block viewer ----
function BlockView(p: { b: any; items: any; base: string; region: string; accent: string; classId: number; spec: string }) {
    const b = p.b
    if (b.t === "h") return <h2 style={{ margin: "18px 0 0", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{b.x}</h2>
    if (b.t === "p") return <div style={{ fontSize: 15, lineHeight: "24px", color: "#D6DAE2", whiteSpace: "pre-wrap" }}>{b.x}</div>
    if (b.t === "tip") return <div style={{ borderLeft: "3px solid " + p.accent, background: "rgba(232,182,79,0.08)", borderRadius: "4px 12px 12px 4px", padding: "12px 16px", fontSize: 14, lineHeight: "22px", whiteSpace: "pre-wrap" }}><b style={{ color: p.accent }}>Tip </b>{b.x}</div>
    if (b.t === "build") {
        const hash = "c=" + b.c + "&l=" + b.l + "&b=" + b.b
        return (
            <div style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{b.label || "Talent build"}</div>
                    <div style={{ flex: 1 }} />
                    <a href={"/talents#" + hash} style={{ fontSize: 13, fontWeight: 700, color: p.accent, textDecoration: "none", border: "1px solid " + p.accent, borderRadius: 9, padding: "6px 12px" }}>Open in planner</a>
                </div>
                {b.note ? <div style={{ fontSize: 14, color: MUTED, lineHeight: "21px", whiteSpace: "pre-wrap" }}>{b.note}</div> : null}
                <TalentBuild apiUrl={p.base} region={p.region} classId={b.c} level={b.l} build={b.b} readOnly focusSpec={p.spec} accent={p.accent} />
            </div>
        )
    }
    if (b.t === "items") {
        return (
            <div style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{b.label || "Items"}</div>
                {(b.ids || []).map((id: number) => {
                    const it = p.items[id]
                    return (
                        <a key={id} href={"/item?id=" + id} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: QUALITY[String(it?.quality || "").toUpperCase()] || TEXT, fontSize: 14, fontWeight: 650 }}>
                            {it?.icon ? <img src={it.icon} width={28} height={28} style={{ borderRadius: 6, display: "block" }} /> : <span style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.08)" }} />}
                            {it?.name || "Item #" + id}
                        </a>
                    )
                })}
            </div>
        )
    }
    return null
}

// ---- block editors ----
function ItemsEditor(p: { b: any; set: (b: any) => void; base: string; names: Record<number, any>; setNames: (n: Record<number, any>) => void }) {
    const [q, setQ] = React.useState("")
    const [res, setRes] = React.useState<any[]>([])
    React.useEffect(() => {
        if (q.trim().length < 2) { setRes([]); return }
        let live = true
        const t = setTimeout(() => fetch(p.base + "/api/items?limit=8&q=" + encodeURIComponent(q.trim())).then((r) => r.json()).then((d) => live && setRes(d.items || [])).catch(() => {}), 250)
        return () => { live = false; clearTimeout(t) }
    }, [q])
    const ids: number[] = p.b.ids || []
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input value={p.b.label || ""} maxLength={60} placeholder="List title, e.g. Best in slot" onChange={(e) => p.set({ ...p.b, label: e.target.value })} style={input} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ids.map((id) => <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: EDGE, borderRadius: 999, padding: "4px 6px 4px 12px", fontSize: 13, color: QUALITY[String(p.names[id]?.quality || "").toUpperCase()] || TEXT }}>{p.names[id]?.name || "Item #" + id}<button onClick={() => p.set({ ...p.b, ids: ids.filter((x) => x !== id) })} style={{ border: "none", background: "transparent", color: MUTED, cursor: "pointer", fontSize: 14 }}>×</button></span>)}
            </div>
            <input value={q} placeholder="Search an item by name or ID to add it" onChange={(e) => setQ(e.target.value)} style={input} />
            {res.length ? <div style={{ border: EDGE, borderRadius: 10, overflow: "hidden" }}>
                {res.filter((r) => !ids.includes(r.id)).map((r) => (
                    <div key={r.id} onClick={() => { if (ids.length < 14) { p.set({ ...p.b, ids: [...ids, r.id] }); p.setNames({ ...p.names, [r.id]: r }); setQ(""); setRes([]) } }} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: QUALITY[String(r.quality || "").toUpperCase()] || TEXT, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{r.name}<span style={{ color: MUTED }}>{"  #" + r.id}</span></div>
                ))}
            </div> : null}
        </div>
    )
}

export default function Guides(props: { apiUrl: string; accent: string; region: string }) {
    const base = (props.apiUrl || "").replace(/\/$/, "")
    const accent = props.accent || "#E8B64F"
    const region = props.region || "us"
    const [classes, setClasses] = React.useState<any[]>([])
    const [token, setToken] = React.useState("")
    const [user, setUser] = React.useState<any>(null)
    const [view, setView] = React.useState<"list" | "read" | "edit" | "mine" | "signin">("list")
    const [classF, setClassF] = React.useState<number | null>(null)
    const [specF, setSpecF] = React.useState("")
    const [kindF, setKindF] = React.useState("")
    const [q, setQ] = React.useState("")
    const [sort, setSort] = React.useState("top")
    const [list, setList] = React.useState<any[] | null>(null)
    const [mine, setMine] = React.useState<any[] | null>(null)
    const [guide, setGuide] = React.useState<any>(null)
    const [draft, setDraft] = React.useState<any>(null)
    const [names, setNames] = React.useState<Record<number, any>>({})
    const [specs, setSpecs] = React.useState<string[]>([])
    const [fspecs, setFSpecs] = React.useState<string[]>([])
    const [msg, setMsg] = React.useState("")
    const [busy, setBusy] = React.useState(false)
    const [code, setCode] = React.useState("")
    const [after, setAfter] = React.useState<"list" | "new">("list")
    const [reporting, setReporting] = React.useState<string | null>(null)

    const call = async (path: string, body?: any, tok?: string) => {
        const t = tok ?? token
        const headers: any = {}
        if (t) headers.Authorization = "Bearer " + t
        if (body) headers["Content-Type"] = "application/json"
        try {
            const r = await fetch(base + path, { method: body ? "POST" : "GET", headers, body: body ? JSON.stringify(body) : undefined })
            const d = await r.json().catch(() => ({ error: "Unexpected reply from the server." }))
            if (r.status === 401 && t) { store.set("fw_guide_token", ""); setToken(""); setUser(null) }
            return { ok: r.ok, d }
        } catch (e) { return { ok: false, d: { error: "Could not reach the API." } } }
    }

    // start-up: session, classes, deep link
    React.useEffect(() => {
        if (!base) return
        const t = store.get("fw_guide_token")
        if (t) { setToken(t); call("/api/guides/me", undefined, t).then((r) => { if (r.ok) setUser(r.d.user) }) }
        fetch(base + "/api/talents?region=" + region).then((r) => r.json()).then((d) => d.classes && setClasses(d.classes)).catch(() => {})
        try { const m = (window.location.hash || "").match(/g=([a-z0-9]+)/); if (m) openGuide(m[1], t) } catch (e) {}
    }, [base])

    const loadSpecs = (cid: number | null, set: (s: string[]) => void) => {
        if (cid == null) { set([]); return }
        const k = base + cid
        if (specCache[k]) { set(specCache[k]); return }
        fetch(base + "/api/talents?region=" + region + "&class=" + cid).then((r) => r.json()).then((d) => { const s = (d.trees || []).map((t: any) => t.name); specCache[k] = s; set(s) }).catch(() => set([]))
    }
    React.useEffect(() => { loadSpecs(classF, setFSpecs); setSpecF("") }, [classF])
    React.useEffect(() => { if (draft) loadSpecs(draft.classId, setSpecs) }, [draft?.classId])

    React.useEffect(() => {
        if (!base || view !== "list") return
        let live = true
        const p = new URLSearchParams()
        if (classF != null) p.set("class", String(classF))
        if (specF) p.set("spec", specF)
        if (kindF) p.set("kind", kindF)
        if (q.trim()) p.set("q", q.trim())
        p.set("sort", sort)
        const t = setTimeout(() => call("/api/guides?" + p.toString()).then((r) => { if (live) setList(r.ok ? r.d.guides : []) }), q ? 250 : 0)
        return () => { live = false; clearTimeout(t) }
    }, [base, view, classF, specF, kindF, q, sort, token])

    const openGuide = async (id: string, tok?: string) => {
        setView("read"); setGuide(null); setMsg("")
        try { window.history.replaceState(null, "", "#g=" + id) } catch (e) {}
        const r = await call("/api/guides/get?id=" + id, undefined, tok)
        if (r.ok) setGuide(r.d.guide); else setGuide({ error: r.d.error || "Guide not found." })
        try { window.scrollTo({ top: 0 }) } catch (e) {}
    }
    const toList = () => { setView("list"); setMsg(""); setReporting(null); try { window.history.replaceState(null, "", window.location.pathname) } catch (e) {} }
    const openMine = async () => {
        setView("mine"); setMine(null); setMsg("")
        const r = await call("/api/guides/mine"); setMine(r.ok ? r.d.guides : [])
    }
    const needSignin = (next: "list" | "new") => { setAfter(next); setView("signin"); setMsg("") }
    const startNew = () => {
        if (!token) return needSignin("new")
        setDraft({ title: "", classId: classes[0]?.id ?? 1, className: classes[0]?.name || "", spec: "", kind: "leveling", blocks: [{ k: uid(), t: "p", x: "" }] })
        setNames({}); setView("edit"); setMsg("")
    }
    const editGuide = (g: any) => {
        setNames(g.items || {})
        setDraft({ id: g.id, title: g.title, classId: g.classId, className: g.className, spec: g.spec, kind: g.kind, blocks: (g.blocks || []).map((b: any) => ({ ...b, k: uid() })) })
        setView("edit"); setMsg("")
    }
    const editFromList = async (id: string) => { const r = await call("/api/guides/get?id=" + id); if (r.ok) editGuide(r.d.guide) }
    const signIn = async () => {
        setBusy(true); setMsg("")
        const r = await call("/api/guides/signin", { code }, "")
        setBusy(false)
        if (!r.ok) { setMsg(r.d.error || "Sign in failed."); return }
        store.set("fw_guide_token", r.d.token); setToken(r.d.token); setUser(r.d.user); setCode("")
        const me = await call("/api/guides/me", undefined, r.d.token); if (me.ok) setUser(me.d.user)
        if (after === "new") {
            setDraft({ title: "", classId: classes[0]?.id ?? 1, className: classes[0]?.name || "", spec: "", kind: "leveling", blocks: [{ k: uid(), t: "p", x: "" }] }); setNames({}); setView("edit")
        } else setView("list")
    }
    const signOut = async () => { await call("/api/guides/signout", {}); store.set("fw_guide_token", ""); setToken(""); setUser(null); toList() }
    const save = async () => {
        setBusy(true); setMsg("")
        const r = await call("/api/guides/save", { ...draft, blocks: draft.blocks.map(({ k, ...b }: any) => b) })
        setBusy(false)
        if (!r.ok) { setMsg(r.d.error || "Could not save."); return }
        await openMine()
        setMsg(r.d.status === "pending" ? "Submitted. A moderator approves your first guide, then it appears on the Guides page. After that, your guides publish straight away." : "Saved and live.")
    }
    const del = async (id: string) => { const r = await call("/api/guides/delete", { id }); if (r.ok) { setMine((m) => (m || []).filter((x) => x.id !== id)); if (view === "read") toList() } }
    const vote = async () => {
        if (!token) return needSignin("list")
        const r = await call("/api/guides/vote", { id: guide.id })
        if (r.ok) setGuide({ ...guide, votes: r.d.votes, voted: r.d.voted }); else setMsg(r.d.error || "")
    }
    const report = async (reason: string) => {
        if (!token) return needSignin("list")
        const r = await call("/api/guides/report", { id: guide.id, reason })
        setReporting(null); setMsg(r.ok ? "Thanks, a moderator will take a look." : r.d.error || "")
    }

    // draft helpers
    const setBlock = (k: string, nb: any) => setDraft({ ...draft, blocks: draft.blocks.map((b: any) => (b.k === k ? { ...nb, k } : b)) })
    const move = (i: number, d: number) => { const bl = [...draft.blocks]; const j = i + d; if (j < 0 || j >= bl.length) return; [bl[i], bl[j]] = [bl[j], bl[i]]; setDraft({ ...draft, blocks: bl }) }
    const addBlock = (t: string) => {
        const nb: any = { k: uid(), t }
        if (t === "build") Object.assign(nb, { label: "", note: "", c: draft.classId, l: 60, b: "" })
        else if (t === "items") Object.assign(nb, { label: "", ids: [] })
        else nb.x = ""
        setDraft({ ...draft, blocks: [...draft.blocks, nb] })
    }
    const pickClass = (c: any) => {
        if (c.id === draft.classId) return
        setDraft({ ...draft, classId: c.id, className: c.name, spec: "", blocks: draft.blocks.map((b: any) => (b.t === "build" ? { ...b, c: c.id, b: "" } : b)) })
    }

    if (!base) return <div style={{ fontFamily: FONT, color: MUTED, padding: 24 }}>Set the API URL on this component.</div>

    const head = (title: string, sub: string) => (
        <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: accent }}>COMMUNITY</div>
            <h1 style={{ margin: "6px 0 6px", fontSize: 44, lineHeight: "1.05em", letterSpacing: "-0.03em", fontWeight: 800 }}>{title}</h1>
            <div style={{ fontSize: 16, color: MUTED }}>{sub}</div>
        </div>
    )
    const note = msg ? <div style={{ ...card, padding: "12px 16px", fontSize: 14, color: msg.startsWith("Submitted") || msg.startsWith("Saved") || msg.startsWith("Thanks") ? accent : "#FF8A8A" }}>{msg}</div> : null
    const userBar = (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            {user ? <span style={{ fontSize: 13, color: MUTED }}>{"Signed in as "}<b style={{ color: TEXT }}>{user.name}</b>{user.verified ? <span style={{ color: "#5CFF8A" }}>{"  ✅ verified"}</span> : null}</span> : null}
            {user ? <Btn accent={accent} onClick={openMine}>My guides</Btn> : null}
            <Btn accent={accent} primary onClick={startNew}>Write a guide</Btn>
            {user ? <Btn accent={accent} onClick={signOut}>Sign out</Btn> : <Btn accent={accent} onClick={() => needSignin("list")}>Sign in</Btn>}
        </div>
    )

    // ---------- sign in ----------
    if (view === "signin") {
        return (
            <div style={{ fontFamily: FONT, color: TEXT, width: "100%", display: "flex", flexDirection: "column", gap: 18, padding: "8px 0", maxWidth: 640 }}>
                {head("Sign in", "Use your Discord account to write guides and vote.")}
                <div style={{ ...card, padding: 22, display: "flex", flexDirection: "column", gap: 14, fontSize: 15, lineHeight: "23px" }}>
                    <div><b style={{ color: accent }}>1.</b> In the Discord server with the Forever WoW bot, press <b>Website sign-in</b> on the link panel.</div>
                    <div><b style={{ color: accent }}>2.</b> The bot privately replies with an 8 character code.</div>
                    <div><b style={{ color: accent }}>3.</b> Enter it here. It works once and lasts 10 minutes.</div>
                    <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABCD-EFGH" maxLength={9} onKeyDown={(e) => { if (e.key === "Enter" && code.length >= 8) signIn() }} style={{ ...input, fontSize: 22, letterSpacing: "0.2em", fontWeight: 800, textAlign: "center", maxWidth: 260 }} />
                    <div style={{ display: "flex", gap: 8 }}><Btn accent={accent} primary disabled={busy || code.replace(/[^A-Z0-9]/g, "").length < 8} onClick={signIn}>{busy ? "Checking..." : "Sign in"}</Btn><Btn accent={accent} onClick={toList}>Back</Btn></div>
                </div>
                {note}
            </div>
        )
    }

    // ---------- editor ----------
    if (view === "edit" && draft) {
        const col = CLASS_COLOURS[draft.className] || accent
        const canSave = draft.title.trim().length >= 4 && draft.spec && draft.blocks.length > 0
        return (
            <div style={{ fontFamily: FONT, color: TEXT, width: "100%", display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
                {head(draft.id ? "Edit guide" : "Write a guide", "Pick your class and spec, then build the guide from blocks. Talent builds are editable trees.")}
                {note}
                <div style={{ ...card, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                    <div><div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Title</div><input value={draft.title} maxLength={80} placeholder="e.g. Fast leveling 1-40" onChange={(e) => setDraft({ ...draft, title: e.target.value })} style={input} /></div>
                    <div><div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Class</div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{classes.map((c) => <Chip key={c.id} on={c.id === draft.classId} col={CLASS_COLOURS[c.name] || accent} onClick={() => pickClass(c)}>{c.name}</Chip>)}</div></div>
                    <div><div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Spec</div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{specs.map((s) => <Chip key={s} on={s === draft.spec} col={col} onClick={() => setDraft({ ...draft, spec: s })}>{s}</Chip>)}{!specs.length ? <span style={{ fontSize: 13, color: MUTED }}>Loading specs...</span> : null}</div></div>
                    <div><div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Type</div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{KINDS.map(([k, n]) => <Chip key={k} on={k === draft.kind} col={accent} onClick={() => setDraft({ ...draft, kind: k })}>{n}</Chip>)}</div></div>
                    <div style={{ fontSize: 13, color: MUTED }}>{"Shown as: "}<Title g={{ author: user?.name || "You", className: draft.className, spec: draft.spec || "Spec", title: draft.title || "Title" }} size={14} accent={accent} /></div>
                </div>
                {draft.blocks.map((b: any, i: number) => (
                    <div key={b.k} style={{ ...card, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 750, letterSpacing: "0.08em", color: accent, textTransform: "uppercase" }}>{(BLOCKS.find((x) => x[0] === b.t) || [b.t, b.t])[1]}</span>
                            <div style={{ flex: 1 }} />
                            <Btn accent={accent} onClick={() => move(i, -1)}>↑</Btn><Btn accent={accent} onClick={() => move(i, 1)}>↓</Btn>
                            <Btn accent={accent} danger onClick={() => setDraft({ ...draft, blocks: draft.blocks.filter((x: any) => x.k !== b.k) })}>Remove</Btn>
                        </div>
                        {b.t === "h" ? <input value={b.x} maxLength={120} placeholder="Section heading" onChange={(e) => setBlock(b.k, { ...b, x: e.target.value })} style={input} /> : null}
                        {b.t === "p" ? <textarea value={b.x} maxLength={4000} rows={6} placeholder="Write your guide text here" onChange={(e) => setBlock(b.k, { ...b, x: e.target.value })} style={{ ...input, resize: "vertical", lineHeight: "22px" }} /> : null}
                        {b.t === "tip" ? <textarea value={b.x} maxLength={1000} rows={3} placeholder="A quick tip or warning" onChange={(e) => setBlock(b.k, { ...b, x: e.target.value })} style={{ ...input, resize: "vertical" }} /> : null}
                        {b.t === "build" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <input value={b.label} maxLength={60} placeholder="Build name, e.g. Leveling 1-40" onChange={(e) => setBlock(b.k, { ...b, label: e.target.value })} style={input} />
                                <input value={b.note} maxLength={500} placeholder="Why this build? (optional)" onChange={(e) => setBlock(b.k, { ...b, note: e.target.value })} style={input} />
                                <TalentBuild key={b.k + "-" + draft.classId} apiUrl={base} region={region} classId={draft.classId} level={b.l} build={b.b} focusSpec={draft.spec} accent={accent} onChange={(nb, nl) => setBlock(b.k, { ...b, b: nb, l: nl })} />
                            </div>
                        ) : null}
                        {b.t === "items" ? <ItemsEditor b={b} set={(nb) => setBlock(b.k, nb)} base={base} names={names} setNames={setNames} /> : null}
                    </div>
                ))}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: MUTED }}>Add:</span>
                    {BLOCKS.map(([t, n]) => <Btn key={t} accent={accent} onClick={() => addBlock(t)}>{"+ " + n}</Btn>)}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Btn accent={accent} primary disabled={busy || !canSave} onClick={save}>{busy ? "Saving..." : draft.id ? "Save changes" : "Submit guide"}</Btn>
                    <Btn accent={accent} onClick={() => { setView(user ? "mine" : "list"); if (user) openMine() }}>Cancel</Btn>
                    {!canSave ? <span style={{ fontSize: 13, color: MUTED, alignSelf: "center" }}>Needs a title, a spec and some content.</span> : null}
                </div>
            </div>
        )
    }

    // ---------- my guides ----------
    if (view === "mine") {
        return (
            <div style={{ fontFamily: FONT, color: TEXT, width: "100%", display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
                {head("My guides", "Everything you have written, with its status.")}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Btn accent={accent} onClick={toList}>All guides</Btn><Btn accent={accent} primary onClick={startNew}>Write a guide</Btn></div>
                {note}
                {mine === null ? <div style={{ color: MUTED, fontSize: 14 }}>Loading...</div> : null}
                {mine && !mine.length ? <div style={{ ...card, padding: 22, color: MUTED, fontSize: 14 }}>You haven't written a guide yet.</div> : null}
                {(mine || []).map((g) => (
                    <div key={g.id} style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                        <Title g={g} size={17} accent={accent} />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                            <Tag col={(STATUS[g.status] || ["", MUTED])[1]}>{(STATUS[g.status] || [g.status])[0]}</Tag><Tag>{kindName(g.kind)}</Tag>
                            <span style={{ fontSize: 12, color: MUTED }}>{"▲ " + g.votes + "  ·  updated " + when(g.updated)}</span>
                            <div style={{ flex: 1 }} />
                            {g.status === "published" ? <Btn accent={accent} onClick={() => openGuide(g.id)}>View</Btn> : null}
                            {g.status !== "hidden" ? <Btn accent={accent} onClick={() => editFromList(g.id)}>Edit</Btn> : null}
                            <Btn accent={accent} danger onClick={() => del(g.id)}>Delete</Btn>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // ---------- read ----------
    if (view === "read") {
        const g = guide
        return (
            <div style={{ fontFamily: FONT, color: TEXT, width: "100%", display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
                <div><Btn accent={accent} onClick={toList}>← All guides</Btn></div>
                {!g ? <div style={{ color: MUTED, fontSize: 14 }}>Loading...</div> : null}
                {g && g.error ? <div style={{ ...card, padding: 22, color: MUTED }}>{g.error}</div> : null}
                {g && !g.error ? (
                    <>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <Title g={g} size={30} accent={accent} />
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                                <Tag>{kindName(g.kind)}</Tag>
                                {g.verified ? <Tag col="#5CFF8A">✅ Verified author</Tag> : null}
                                {g.status !== "published" ? <Tag col={(STATUS[g.status] || ["", accent])[1]}>{(STATUS[g.status] || [g.status])[0]}</Tag> : null}
                                <span style={{ fontSize: 13, color: MUTED }}>{"Updated " + when(g.updated)}</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {g.status === "published" ? <Btn accent={accent} primary={g.voted} onClick={vote}>{(g.voted ? "▲ Upvoted  " : "▲ Upvote  ") + g.votes}</Btn> : null}
                                {g.own ? <Btn accent={accent} onClick={() => editGuide(g)}>Edit</Btn> : null}
                                {g.own ? <Btn accent={accent} danger onClick={() => del(g.id)}>Delete</Btn> : null}
                                {!g.own && g.status === "published" ? <Btn accent={accent} onClick={() => (token ? setReporting(g.id) : needSignin("list"))}>Report</Btn> : null}
                            </div>
                            {reporting === g.id ? <ReportBox accent={accent} onSend={report} onCancel={() => setReporting(null)} /> : null}
                        </div>
                        {note}
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {(g.blocks || []).map((b: any, i: number) => <BlockView key={i} b={b} items={g.items || {}} base={base} region={region} accent={accent} classId={g.classId} spec={g.spec} />)}
                        </div>
                    </>
                ) : null}
            </div>
        )
    }

    // ---------- list ----------
    return (
        <div style={{ fontFamily: FONT, color: TEXT, width: "100%", display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
            {head("Guides", "Builds and guides written by players. Sign in with Discord to write your own.")}
            {userBar}
            {note}
            <div style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Chip on={classF == null} col={accent} onClick={() => setClassF(null)}>All classes</Chip>
                    {classes.map((c) => <Chip key={c.id} on={c.id === classF} col={CLASS_COLOURS[c.name] || accent} onClick={() => setClassF(c.id === classF ? null : c.id)}>{c.name}</Chip>)}
                </div>
                {classF != null && fspecs.length ? <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{fspecs.map((s) => <Chip key={s} on={s === specF} col={accent} onClick={() => setSpecF(s === specF ? "" : s)}>{s}</Chip>)}</div> : null}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <Chip on={!kindF} col={accent} onClick={() => setKindF("")}>Any type</Chip>
                    {KINDS.map(([k, n]) => <Chip key={k} on={kindF === k} col={accent} onClick={() => setKindF(kindF === k ? "" : k)}>{n}</Chip>)}
                    <div style={{ flex: 1 }} />
                    <Chip on={sort === "top"} col={accent} onClick={() => setSort("top")}>Top rated</Chip>
                    <Chip on={sort === "new"} col={accent} onClick={() => setSort("new")}>Newest</Chip>
                </div>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, author, class or spec" style={input} />
            </div>
            {list === null ? <div style={{ color: MUTED, fontSize: 14 }}>Loading guides...</div> : null}
            {list && !list.length ? <div style={{ ...card, padding: 24, color: MUTED, fontSize: 14, lineHeight: "22px" }}>No guides here yet. Be the first to write one for this class.</div> : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(list || []).map((g) => (
                    <div key={g.id} onClick={() => openGuide(g.id)} style={{ ...card, padding: "16px 18px", cursor: "pointer", display: "flex", gap: 16, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 44, textAlign: "center", color: g.voted ? accent : MUTED }}><div style={{ fontSize: 13 }}>▲</div><div style={{ fontSize: 17, fontWeight: 800, color: g.voted ? accent : TEXT }}>{g.votes}</div></div>
                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                            <Title g={g} size={17} accent={accent} />
                            {g.excerpt ? <div style={{ fontSize: 14, color: MUTED, lineHeight: "21px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>{g.excerpt}</div> : null}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                                {g.featured ? <Tag col={accent}>Featured</Tag> : null}
                                <Tag>{kindName(g.kind)}</Tag>
                                {g.builds ? <Tag>{g.builds + (g.builds === 1 ? " talent build" : " talent builds")}</Tag> : null}
                                {g.verified ? <Tag col="#5CFF8A">✅ Verified</Tag> : null}
                                <span style={{ fontSize: 12, color: MUTED }}>{"Updated " + when(g.updated)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ReportBox(p: { accent: string; onSend: (r: string) => void; onCancel: () => void }) {
    const [r, setR] = React.useState("")
    return (
        <div style={{ ...card, padding: 14, display: "flex", flexDirection: "column", gap: 8, maxWidth: 520 }}>
            <div style={{ fontSize: 13, color: MUTED }}>What's wrong with this guide? (spam, harmful, wrong class...)</div>
            <input value={r} maxLength={300} onChange={(e) => setR(e.target.value)} style={input} />
            <div style={{ display: "flex", gap: 8 }}><Btn accent={p.accent} primary onClick={() => p.onSend(r)}>Send report</Btn><Btn accent={p.accent} onClick={p.onCancel}>Cancel</Btn></div>
        </div>
    )
}

Guides.defaultProps = { apiUrl: "", accent: "#E8B64F", region: "us" }

addPropertyControls(Guides, {
    apiUrl: { type: ControlType.String, title: "API URL", defaultValue: "" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#E8B64F" },
    region: { type: ControlType.String, title: "Region", defaultValue: "us" },
})
