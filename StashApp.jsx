import { useState, useEffect } from "react";
import {
  Gift, Eye, EyeOff, Bookmark, X, FolderOpen, ExternalLink, Plus,
  Library as LibraryIcon, Archive, ChevronDown, ChevronUp, AlertTriangle,
  MoreVertical, Video, FileText, Puzzle, FileLock2, BookOpen, Headphones,
  Image as ImageIcon, ArrowRight, ArrowLeft, Sticker, PenLine, Trash2, Music, Newspaper, FolderInput,
} from "lucide-react";

/* =====================================================================
   Stash MVP1 — single app, built to the Engineering Handoff (Group 8)
   ===================================================================== */

/* ---- Design tokens (handoff §2) ---- */
const T = {
  brand: "#5C3FD1", brandHover: "#4A32B0", brandActive: "#3A2490",
  brandLight: "#EEEDFE", brandMid: "#534AB7",
  text: "#111827", textSec: "#6B7280", textMuted: "#9CA3AF", placeholder: "#9CA3AF",
  bg: "#FFFFFF", bg2: "#F9FAFB", bg3: "#F3F4F6",
  border: "#E5E7EB", borderFocus: "#5C3FD1",
  success: "#10B981", error: "#EF4444", errorHover: "#DC2626", warning: "#F59E0B",
  dashed: "#C4B8F0", panel: "#5F51C6",
  shadowCard: "0 1px 4px rgba(0,0,0,0.08)",
  shadowModal: "0 8px 32px rgba(0,0,0,0.18)",
  focusRing: "0 0 0 3px rgba(92,63,209,0.12)",
};

/* content-type pill palette (handoff §2) */
const CT = {
  Article:    { bg: "#E1F5EE", text: "#085041", icon: Newspaper },
  Video:      { bg: "#FAEEDA", text: "#633806", icon: Video },
  Audio:      { bg: "#FAECE7", text: "#712B13", icon: Music },
  Image:      { bg: "#FBEAF0", text: "#72243E", icon: ImageIcon },
  Document:   { bg: "#F1EFE8", text: "#444441", icon: FileText },
  Unsorted:   { bg: "#FEF3C7", text: "#92400E", icon: null },
  Collection: { bg: "#EEEDFE", text: "#3C3489", icon: null },
};

const F = "'Inter', sans-serif";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Yellowtail&display=swap');
.stash *{box-sizing:border-box;}
.stash input::placeholder{color:${T.placeholder};}
.s-input:focus{border-color:${T.borderFocus};box-shadow:${T.focusRing};}
.s-primary{transition:background .12s ease, transform .1s ease;}
.s-primary:hover{background:${T.brandHover};}
.s-primary:active{background:${T.brandActive};}
.s-secondary{transition:border-color .12s ease, color .12s ease;}
.s-secondary:hover{border-color:${T.brand};color:${T.brand};}
.s-danger{transition:background .12s ease;}
.s-danger:hover{background:${T.errorHover};}
.nav-item{transition:background .12s ease;}
.nav-item:hover{background:${T.bg3};}
.nav-item.active:hover{background:${T.brand};}
.scard{transition:transform .14s ease, box-shadow .14s ease;}
.scard:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(17,24,39,.10);}
.coll-card{transition:transform .14s ease, box-shadow .14s ease;}
.coll-card:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(17,24,39,.10);}
.add-card{transition:background .12s ease, border-color .12s ease;}
.add-card:hover{background:${T.brandLight};}
.chip{transition:transform .1s ease;}
.chip:active{transform:scale(.97);}
.link{transition:opacity .12s ease;}
.link:hover{opacity:.75;}
.dd-item{transition:background .1s ease;}
.dd-item:hover{background:${T.bg3};}
.modal-overlay{animation:fade .15s ease;}
.modal-card{animation:pop .18s cubic-bezier(.2,.8,.2,1);}
.toast{animation:slideUp .2s cubic-bezier(.2,.8,.2,1);}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.chips-row::-webkit-scrollbar{height:6px;}
.chips-row::-webkit-scrollbar-thumb{background:#D9D6EC;border-radius:99px;}
.picker{opacity:.55;transition:opacity .15s ease;}
.picker:hover{opacity:1;}
.stash-left-hide{}
@media (max-width: 920px){ .auth-left{display:none !important;} .auth-right{width:100% !important;} }
@media (prefers-reduced-motion: reduce){.modal-overlay,.modal-card,.toast{animation:none;}}
`;

/* shared button styles (handoff §3) */
const btnPrimary = { height: 44, borderRadius: 8, border: "none", cursor: "pointer", background: T.brand, color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: F };
const btnSecondary = { height: 44, borderRadius: 8, cursor: "pointer", background: T.bg, border: `1px solid ${T.border}`, color: "#374151", fontSize: 15, fontWeight: 600, fontFamily: F };
const inputBase = { width: "100%", height: 44, borderRadius: 8, border: `1px solid ${T.border}`, padding: "0 14px", fontSize: 14, color: T.text, background: T.bg, outline: "none", fontFamily: F };
const labelBase = { display: "block", fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 8, fontFamily: F };
const helperBase = { margin: "8px 0 0", fontSize: 12, color: T.textMuted, fontFamily: F };

/* =====================================================================
   Backend API client  (edit API.base / API.paths if your routes differ)
   ===================================================================== */
const API = {
  base: "https://stash-backend-1-7qpd.onrender.com",
  paths: {
    signup: "/api/auth/signup",
    login: "/api/auth/login",
    me: "/api/auth/me",
    collections: "/api/collections",
    collection: (id) => `/api/collections/${id}`,
    resources: "/api/resources",
    resource: (id) => `/api/resources/${id}`,
  },
};

async function apiFetch(path, { method = "GET", body, token } = {}) {
  const res = await fetch(API.base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* non-json */ }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Request failed (${res.status})`;
    const err = new Error(msg); err.status = res.status; throw err;
  }
  return data;
}

/* defensive field mapping — tolerates id/_id, collectionId/collection_id, etc. */
const pickToken = (d) => d && (d.token || d.accessToken || d.jwt || (d.data && (d.data.token || d.data.accessToken)));
const pickUser = (d) => (d && (d.user || (d.data && d.data.user))) || d;
const normCollection = (c) => ({ id: String(c.id || c._id || c.collectionId), name: c.name || c.title || "Untitled" });
const normResource = (r) => {
  const cid = r.collectionId || r.collection_id || (r.collection && (r.collection._id || r.collection.id || r.collection)) || null;
  return {
    id: String(r.id || r._id),
    title: r.title || r.name || (r.url ? r.url.replace(/^https?:\/\//, "").slice(0, 44) : "Untitled"),
    url: r.url || r.link || "",
    type: r.type || r.contentType || r.content_type || "Article",
    collectionId: cid ? String(cid) : null,
    time: r.time || "Saved",
  };
};
const asArray = (d) => (Array.isArray(d) ? d : (d && (d.data || d.collections || d.resources || d.items)) || []);

const api = {
  signup: (name, email, password) => apiFetch(API.paths.signup, { method: "POST", body: { name, username: name, email, password } }),
  login: (email, password) => apiFetch(API.paths.login, { method: "POST", body: { email, identifier: email, password } }),
  listCollections: (t) => apiFetch(API.paths.collections, { token: t }).then((d) => asArray(d).map(normCollection)),
  createCollection: (name, t) => apiFetch(API.paths.collections, { method: "POST", body: { name }, token: t }).then((d) => normCollection(d.data || d.collection || d)),
  renameCollection: (id, name, t) => apiFetch(API.paths.collection(id), { method: "PATCH", body: { name }, token: t }),
  deleteCollection: (id, mode, t) => apiFetch(`${API.paths.collection(id)}?mode=${mode}`, { method: "DELETE", token: t }),
  listResources: (t) => apiFetch(API.paths.resources, { token: t }).then((d) => asArray(d).map(normResource)),
  createResource: (payload, t) => apiFetch(API.paths.resources, { method: "POST", body: payload, token: t }).then((d) => normResource(d.data || d.resource || d)),
  updateResource: (id, patch, t) => apiFetch(API.paths.resource(id), { method: "PATCH", body: patch, token: t }),
  deleteResource: (id, t) => apiFetch(API.paths.resource(id), { method: "DELETE", token: t }),
};

/* ========================= AUTH ========================= */
function ScriptLogo({ color }) {
  const sq = (x, y, s = 7, r = 2) => (<rect key={`${x}-${y}`} x={x} y={y} width={s} height={s} rx={r} fill={color} />);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
      <svg width="46" height="26" viewBox="0 0 46 26" fill="none" aria-hidden="true">
        {sq(0, 0)} {sq(10, 0)} {sq(28, 0)} {sq(38, 0)}
        {sq(0, 10)} {sq(19, 6, 10, 3)} {sq(38, 10)}
        {sq(10, 18)} {sq(28, 18)}
      </svg>
      <span style={{ fontFamily: "'Yellowtail', cursive", fontSize: 24, color, lineHeight: 1 }}>Stash</span>
    </div>
  );
}

function Scribble() {
  return (
    <svg width="100%" height="6" viewBox="0 0 100 6" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: -5, width: "100%", overflow: "visible" }} aria-hidden="true">
      <path d="M1 4 Q 22 0 44 3.2 T 99 2.6" stroke={T.brand} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function InlineLink({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="link" style={{ position: "relative", background: "none", border: "none", padding: 0, cursor: "pointer", color: T.brand, fontWeight: 600, fontSize: 14.5, fontFamily: F }}>
      {children}<Scribble />
    </button>
  );
}
function AField({ label, type = "text", placeholder, password, value, onChange }) {
  const [show, setShow] = useState(false);
  const inputType = password ? (show ? "text" : "password") : type;
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={labelBase}>{label}</label>
      <div style={{ position: "relative" }}>
        <input className="s-input" type={inputType} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputBase, height: 52, borderRadius: 8, padding: password ? "0 46px 0 14px" : "0 14px", fontSize: 15 }} />
        {password && (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 0, display: "flex" }}>
            {show ? <Eye size={20} strokeWidth={1.8} /> : <EyeOff size={20} strokeWidth={1.8} />}
          </button>
        )}
      </div>
    </div>
  );
}
function FormError({ children }) {
  if (!children) return null;
  return <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "#FEF2F2", border: `1px solid ${T.error}`, color: T.error, fontSize: 13.5, fontFamily: F }}>{children}</div>;
}
function Cta({ children, onClick, disabled }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="s-primary" style={{ ...btnPrimary, width: "100%", height: 52, fontSize: 16, opacity: disabled ? 0.6 : 1, cursor: disabled ? "default" : "pointer" }}>{children}</button>;
}

const previewShadow = "0 18px 40px rgba(17,24,39,0.18)";
function CardDesignSystem() {
  return (
    <div style={{ position: "absolute", left: "20%", top: "22%", width: 250, background: "#fff", borderRadius: 12, padding: 16, boxShadow: previewShadow }}>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: T.bg3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ExternalLink size={15} color={T.textSec} strokeWidth={2} /></div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: F, lineHeight: 1.2 }}>Design System Best Practices</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, fontFamily: F }}>designsystems.com/principles</div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5, margin: "12px 0 0", fontFamily: F }}>A comprehensive guide to building scalable design tokens and component libraries that scale with your team.</p>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: CT.Collection.text, background: CT.Collection.bg, padding: "4px 10px", borderRadius: 20, fontFamily: F }}>Design Resources</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: T.textSec, background: T.bg3, padding: "4px 10px", borderRadius: 20, fontFamily: F }}>Systems</span>
      </div>
    </div>
  );
}
function CardCollection() {
  return (
    <div style={{ position: "absolute", left: "46%", top: "36.5%", width: 212, background: "#fff", borderRadius: 12, padding: 14, boxShadow: "0 20px 44px rgba(17,24,39,0.22)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.4, color: T.textMuted, fontFamily: F }}>COLLECTION</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.textSec, fontFamily: F }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: T.success }} />8 items</span>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: T.brandLight, display: "flex", alignItems: "center", justifyContent: "center" }}><FolderOpen size={17} color={T.brand} strokeWidth={2} /></div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: F }}>Design Resources</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1, fontFamily: F }}>Last updated 2 days ago</div>
        </div>
      </div>
    </div>
  );
}
function CardSaveResource() {
  return (
    <div style={{ position: "absolute", left: "25.5%", top: "45%", width: 218, background: "#fff", borderRadius: 12, padding: 18, boxShadow: previewShadow }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Bookmark size={16} color={T.brand} strokeWidth={2} fill={T.brand} /><span style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: F }}>Save Resource</span></div>
        <X size={16} color={T.textMuted} strokeWidth={2} />
      </div>
      <div style={{ fontSize: 11, color: T.textMuted, margin: "14px 0 6px", fontFamily: F }}>URL</div>
      <div style={{ height: 34, borderRadius: 8, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 10px", fontSize: 12, color: T.placeholder, fontFamily: F }}>https://rauno.me/craft</div>
      <div style={{ fontSize: 11, color: T.textMuted, margin: "10px 0 6px", fontFamily: F }}>Collection</div>
      <div style={{ height: 34, borderRadius: 8, border: `1px solid ${T.dashed}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px 0 10px", fontSize: 12, color: T.text, fontFamily: F }}>Design Resources<Plus size={15} color={T.brand} strokeWidth={2.4} /></div>
      <button className="s-primary" style={{ width: "100%", height: 36, marginTop: 12, borderRadius: 8, border: "none", background: T.brand, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>Save to Stash</button>
    </div>
  );
}
function Blob({ color, left, top, w, h, radius, rotate = 0 }) {
  return <div style={{ position: "absolute", left, top, width: w, height: h, background: color, borderRadius: radius, transform: `rotate(${rotate}deg)`, opacity: 0.95 }} />;
}
function BrandPanel() {
  return (
    <div className="auth-left" style={{ position: "relative", width: "50%", minHeight: "100vh", background: T.panel, overflow: "hidden", flexShrink: 0 }}>
      <Blob color="#D6847A" left="17%" top="13%" w={42} h={34} radius="60% 40% 55% 45% / 55% 50% 50% 45%" rotate={-10} />
      <Blob color="#75AEA3" left="41%" top="11%" w={30} h={40} radius="55% 45% 60% 40% / 60% 55% 45% 40%" rotate={18} />
      <Blob color="#D4AE7E" left="69%" top="17%" w={30} h={46} radius="60% 40% 50% 50% / 65% 60% 40% 35%" rotate={28} />
      <Blob color="#CA5785" left="82%" top="33%" w={42} h={36} radius="55% 45% 60% 40% / 55% 55% 45% 45%" rotate={-12} />
      <Blob color="#D4AE7E" left="73%" top="45%" w={30} h={44} radius="60% 40% 50% 50% / 65% 55% 45% 35%" rotate={-22} />
      <CardDesignSystem /><CardCollection /><CardSaveResource />
      <svg width="56" height="40" viewBox="0 0 56 40" style={{ position: "absolute", left: "15%", top: "63.5%" }} fill="none" aria-hidden="true">
        <path d="M6 34 C 16 22, 30 18, 50 22" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.92" />
        <path d="M2 28 C 12 18, 26 14, 44 17" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      </svg>
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 90, width: 440, textAlign: "center" }}>
        <h2 style={{ fontFamily: F, fontWeight: 600, fontSize: 36, lineHeight: 1.15, color: "#F4F3FE", margin: 0 }}>Stop losing things you<br />meant to keep</h2>
        <p style={{ fontFamily: F, fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.78)", margin: "18px auto 0", maxWidth: 400 }}>Stash is your personal resource library, save links from anywhere, organize them into collections, and find them in seconds.</p>
        <div style={{ display: "flex", gap: 7, justifyContent: "center", marginTop: 28 }}>
          <span style={{ width: 22, height: 7, borderRadius: 4, background: "#fff" }} />
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
        </div>
      </div>
    </div>
  );
}
function AuthHeading({ title, subtitle }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 32 }}>
      <h1 style={{ fontFamily: F, fontWeight: 600, fontSize: 28, color: T.text, margin: 0, display: "inline-flex", alignItems: "center", gap: 10 }}>{title}<Gift size={24} color={T.brand} strokeWidth={2} /></h1>
      <p style={{ fontFamily: F, fontSize: 15, color: T.textSec, margin: "10px 0 0" }}>{subtitle}</p>
    </div>
  );
}
function SignUp({ onLogin, onSubmit, submitting, error }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localErr, setLocalErr] = useState("");
  const submit = () => {
    setLocalErr("");
    if (!email.trim() || !password) { setLocalErr("Please enter your email and a password."); return; }
    if (password.length < 8) { setLocalErr("Must be at least 8 characters"); return; }
    if (password !== confirm) { setLocalErr("Passwords do not match"); return; }
    onSubmit({ name: name.trim(), email: email.trim(), password });
  };
  return (
    <>
      <AuthHeading title="Welcome to Stash" subtitle="Save and organize everything that matters to you" />
      <AField label="Full Name" placeholder="e.g John Doe" value={name} onChange={setName} />
      <AField label="Email" type="email" placeholder="e.g you@example.com" value={email} onChange={setEmail} />
      <AField label="Password" placeholder="Enter your password" password value={password} onChange={setPassword} />
      <AField label="Confirm Password" placeholder="Enter your password" password value={confirm} onChange={setConfirm} />
      <FormError>{localErr || error}</FormError>
      <div style={{ marginTop: 16 }}><Cta onClick={submit} disabled={submitting}>{submitting ? "Creating account…" : "Create Account"}</Cta></div>
      <div style={{ textAlign: "center", marginTop: 24, fontSize: 14.5, color: T.text, fontFamily: F }}>Already have an account? <InlineLink onClick={onLogin}>Login</InlineLink></div>
    </>
  );
}
function Login({ onSignup, onSubmit, submitting, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localErr, setLocalErr] = useState("");
  const submit = () => {
    setLocalErr("");
    if (!email.trim() || !password) { setLocalErr("Please enter your email and password."); return; }
    onSubmit({ email: email.trim(), password });
  };
  return (
    <>
      <AuthHeading title="Welcome Back" subtitle="Log in to your Stash library" />
      <AField label="Email" type="email" placeholder="e.g you@example.com" value={email} onChange={setEmail} />
      <AField label="Password" placeholder="Enter your password" password value={password} onChange={setPassword} />
      <div style={{ textAlign: "right", marginTop: -6, marginBottom: 8 }}>
        <button type="button" className="link" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: T.brand, fontWeight: 600, fontSize: 13.5, fontFamily: F }}>Forgot password?</button>
      </div>
      <FormError>{localErr || error}</FormError>
      <div style={{ marginTop: 18 }}><Cta onClick={submit} disabled={submitting}>{submitting ? "Signing in…" : "Log in"}</Cta></div>
      <div style={{ textAlign: "center", marginTop: 24, fontSize: 14.5, color: T.text, fontFamily: F }}>Don&apos;t have an account? <InlineLink onClick={onSignup}>Sign up for free</InlineLink></div>
    </>
  );
}
function AuthFlow({ onAuthed }) {
  const [mode, setMode] = useState("signup");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handle = async (kind, creds) => {
    setError(""); setSubmitting(true);
    try {
      const data = kind === "signup"
        ? await api.signup(creds.name, creds.email, creds.password)
        : await api.login(creds.email, creds.password);
      const token = pickToken(data);
      onAuthed({ token: token || null, user: pickUser(data), online: true });
    } catch (e) {
      // auth rejection (bad credentials / validation) -> show message; network/cold-start -> let them in offline
      if (e.status === 400 || e.status === 401 || e.status === 409 || e.status === 422) {
        setError(e.message);
      } else {
        setError("");
        onAuthed({ token: null, user: { email: creds.email }, online: false });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stash" style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: F }}>
      <style>{CSS}</style>
      <BrandPanel />
      <div className="auth-right" style={{ position: "relative", width: "50%", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
        <div style={{ position: "absolute", top: 32, right: 40 }}><ScriptLogo color={T.brand} /></div>
        <div style={{ width: "100%", maxWidth: 452 }}>
          {mode === "signup"
            ? <SignUp onLogin={() => { setError(""); setMode("login"); }} onSubmit={(c) => handle("signup", c)} submitting={submitting} error={error} />
            : <Login onSignup={() => { setError(""); setMode("signup"); }} onSubmit={(c) => handle("login", c)} submitting={submitting} error={error} />}
          {submitting && <p style={{ textAlign: "center", marginTop: 14, fontSize: 12.5, color: T.textMuted, fontFamily: F }}>The server may take a moment to wake up on first use.</p>}
        </div>
        <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center", fontSize: 12.5, color: T.textMuted, fontFamily: F }}>Privacy Policy · Terms of Service</div>
      </div>
    </div>
  );
}

/* ========================= HOME (data-driven) ========================= */
function CountBadge({ children, bg, color }) {
  return <span style={{ minWidth: 22, height: 22, padding: "0 7px", borderRadius: 999, background: bg, color, fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>{children}</span>;
}

function Pill({ type, label }) {
  const c = CT[type] || CT.Collection;
  const Icon = c.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: c.bg, color: c.text, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, fontFamily: F }}>
      {Icon && <Icon size={13} strokeWidth={2} />}{label || type}
    </span>
  );
}

function Thumb({ type, h = 120 }) {
  const Icon = (CT[type] && CT[type].icon) || FileText;
  return (
    <div style={{ height: h, background: T.brandLight, borderRadius: "12px 12px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={28} color={T.brandMid} strokeWidth={1.8} />
    </div>
  );
}

function PageTitle({ children, badge, badgeBg = T.textMuted }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
      <h1 style={{ margin: 0, fontFamily: F, fontSize: 22, fontWeight: 600, color: T.text }}>{children}</h1>
      {badge != null && <CountBadge bg={badgeBg} color="#fff">{badge}</CountBadge>}
    </div>
  );
}

/* generic kebab menu that escapes its card (card uses overflow visible) */
function KebabMenu({ items }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "absolute", top: 14, right: 14, zIndex: 6 }} onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} aria-label="Options" aria-haspopup="menu" aria-expanded={open} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", borderRadius: 8 }}>
        <MoreVertical size={20} color={T.textMuted} strokeWidth={2} />
      </button>
      {open && (
        <>
          <div onClick={(e) => { e.stopPropagation(); setOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 5 }} />
          <div role="menu" style={{ position: "absolute", top: 34, right: 0, width: 212, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadowModal, padding: 6, zIndex: 7 }}>
            {items.map((it, i) => (
              <div key={i}>
                {i > 0 && <div style={{ height: 1, background: T.bg3, margin: "2px 6px" }} />}
                <button className="dd-item" type="button" role="menuitem" onClick={(e) => { e.stopPropagation(); setOpen(false); it.onClick(); }}
                  style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: "11px 12px", borderRadius: 8, fontSize: 14.5, fontWeight: 500, color: it.danger ? T.error : T.text, fontFamily: F }}>
                  {it.icon} {it.label}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Sidebar({ route, go, collections, unsortedCount, onNewCollection, onSignOut }) {
  const inLibrary = route.name === "library";
  const inColl = route.name === "collections" || route.name === "collection";
  const inUnsorted = route.name === "unsorted";
  const row = (active, muted) => ({ display: "flex", alignItems: "center", gap: 12, width: "100%", height: 40, padding: "0 12px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left", fontFamily: F, fontSize: 15, fontWeight: 500, background: active ? T.brand : "transparent", color: active ? "#fff" : (muted ? T.textMuted : T.textSec) });

  return (
    <aside style={{ width: 260, background: T.bg, borderRight: `0.5px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0, minHeight: "100vh" }}>
      <div style={{ padding: "24px 20px 16px" }}><ScriptLogo color={T.text} /></div>
      <div style={{ height: 0.5, background: T.border, margin: "0 20px" }} />

      <nav style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 4 }}>
        <button className={`nav-item${inLibrary ? " active" : ""}`} type="button" onClick={() => go({ name: "library" })} style={row(inLibrary)}>
          <LibraryIcon size={19} strokeWidth={1.9} color={inLibrary ? "#fff" : T.textSec} /><span style={{ flex: 1 }}>Library</span>
        </button>
        <button className={`nav-item${inColl ? " active" : ""}`} type="button" onClick={() => go({ name: "collections" })} style={row(inColl)}>
          <Archive size={19} strokeWidth={1.9} color={inColl ? "#fff" : T.textSec} /><span style={{ flex: 1 }}>Collections</span>
          {inColl ? <ChevronUp size={17} strokeWidth={2.2} color="#fff" /> : <ChevronDown size={17} strokeWidth={2} color={T.textMuted} />}
        </button>
        {inColl && (
          <div style={{ marginLeft: 22, paddingLeft: 14, borderLeft: `2px solid ${T.brandLight}`, display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
            {collections.map((c) => (
              <button key={c.id} className="nav-item" type="button" onClick={() => go({ name: "collection", id: c.id })}
                style={{ ...row(route.name === "collection" && route.id === c.id), height: 36, fontSize: 14 }}>
                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
              </button>
            ))}
            <button className="nav-item" type="button" onClick={onNewCollection} style={{ ...row(false), height: 36, fontSize: 14, color: T.brand, fontWeight: 600, justifyContent: "center" }}><Plus size={17} strokeWidth={2.4} /> New Collection</button>
          </div>
        )}
      </nav>

      <div style={{ height: 0.5, background: T.border, margin: "14px 20px" }} />
      <div style={{ padding: "0 16px" }}>
        <button className={`nav-item${inUnsorted ? " active" : ""}`} type="button" onClick={() => go({ name: "unsorted" })} style={row(inUnsorted, !inLibrary && !inColl && !inUnsorted)}>
          <AlertTriangle size={19} strokeWidth={1.9} color={inUnsorted ? "#fff" : T.warning} /><span style={{ flex: 1 }}>Unsorted</span>
          {unsortedCount > 0 && <CountBadge bg={inUnsorted ? "rgba(255,255,255,.85)" : CT.Unsorted.bg} color={inUnsorted ? T.brand : CT.Unsorted.text}>{unsortedCount}</CountBadge>}
        </button>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ padding: 16 }}>
        <button type="button" onClick={onSignOut} title="Sign out" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: T.bg2, border: `1px solid ${T.border}`, width: "100%", cursor: "pointer", textAlign: "left" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,#C9BEF3,${T.brand})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontFamily: F, fontSize: 15 }}>AJ</div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: F }}>Amara James</div>
            <div style={{ fontSize: 12, color: T.textMuted, fontFamily: F, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>amarajames@gmail.com</div>
          </div>
        </button>
      </div>
    </aside>
  );
}

/* ---- resource card (clickable to open URL, with kebab) ---- */
function ResourceCard({ data, collectionName, onOpen, onMove, onRename, onDelete, extraButton }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.title);
  const tagType = data.collectionId ? "Collection" : "Unsorted";
  const tagLabel = data.collectionId ? (collectionName || "Collection") : "Unsorted";
  return (
    <div style={{ position: "relative", borderRadius: 12 }}>
      <div className="scard" onClick={() => !editing && onOpen()} style={{ background: T.bg, borderRadius: 12, border: `0.5px solid ${T.border}`, overflow: "hidden", boxShadow: T.shadowCard, cursor: "pointer" }}>
        <Thumb type={data.type} />
        <div style={{ padding: 14 }}>
          <div style={{ minHeight: 36 }}>
            {editing ? (
              <input autoFocus value={draft} onClick={(e) => e.stopPropagation()} onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { onRename(draft.trim() || data.title); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
                onBlur={() => { onRename(draft.trim() || data.title); setEditing(false); }}
                style={{ width: "100%", fontSize: 13, fontWeight: 500, color: T.text, fontFamily: F, border: `1px solid ${T.brand}`, borderRadius: 6, padding: "5px 8px", outline: "none" }} />
            ) : (
              <h3 style={{ margin: 0, paddingRight: 22, fontSize: 13, fontWeight: 500, lineHeight: 1.35, color: T.text, fontFamily: F, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{data.title}</h3>
            )}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: T.textMuted, fontFamily: F, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{data.url}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 14 }}>
            <Pill type={data.type} />
            <Pill type={tagType} label={tagLabel} />
            <span style={{ fontSize: 11, color: T.textMuted, fontFamily: F, marginLeft: "auto" }}>{data.time}</span>
          </div>
          {extraButton}
        </div>
      </div>
      <KebabMenu items={[
        { icon: <FolderInput size={17} strokeWidth={1.8} />, label: "Move to Collection", onClick: onMove },
        { icon: <PenLine size={17} strokeWidth={1.8} />, label: "Edit Title", onClick: () => { setDraft(data.title); setEditing(true); } },
        { icon: <Trash2 size={17} strokeWidth={1.8} />, label: "Delete Resource", danger: true, onClick: onDelete },
      ]} />
    </div>
  );
}

function AddCard({ onClick }) {
  return (
    <button className="add-card" type="button" onClick={onClick} style={{ border: `1.5px dashed ${T.dashed}`, borderRadius: 12, background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 270, color: T.brand }}>
      <Plus size={28} strokeWidth={2.2} /><span style={{ marginTop: 10, fontSize: 15, fontWeight: 600, fontFamily: F }}>Save resource</span>
    </button>
  );
}

function GiftOutline({ style }) {
  return (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none" style={style} aria-hidden="true">
      <rect x="12" y="30" width="46" height="30" rx="4" stroke="#E2E2E4" strokeWidth="3" /><path d="M12 40 H58" stroke="#E2E2E4" strokeWidth="3" /><path d="M35 30 V60" stroke="#E2E2E4" strokeWidth="3" /><path d="M35 30 C 28 18, 14 20, 20 28 C 24 32, 35 30, 35 30 Z" stroke="#E2E2E4" strokeWidth="3" /><path d="M35 30 C 42 18, 56 20, 50 28 C 46 32, 35 30, 35 30 Z" stroke="#E2E2E4" strokeWidth="3" />
    </svg>
  );
}
function EmptyState({ heading, subtitle, cta, onAdd }) {
  return (
    <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ position: "relative", width: 380, height: 230, marginBottom: 18 }}>
        <GiftOutline style={{ position: "absolute", left: -6, top: 96, transform: "rotate(-12deg)", opacity: .85 }} />
        <GiftOutline style={{ position: "absolute", right: 2, top: 4, transform: "rotate(10deg)", opacity: .85 }} />
        <div style={{ position: "absolute", left: 56, top: 24, width: 286, height: 150, borderRadius: 14, background: "#3A3A3A", transform: "rotate(-7deg)" }} />
        <div style={{ position: "absolute", left: 38, top: 44, width: 312, height: 150, borderRadius: 14, background: "#fff", boxShadow: "0 24px 50px rgba(17,24,39,.16)", padding: 22 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.brandLight, flexShrink: 0 }} />
            <div style={{ flex: 1 }}><div style={{ height: 9, borderRadius: 6, background: "#E9E6F8", width: "78%" }} /><div style={{ height: 9, borderRadius: 6, background: T.bg3, width: "92%", marginTop: 10 }} /></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "absolute", left: 22, right: 22, bottom: 22 }}>
            <span style={{ background: CT.Collection.bg, color: CT.Collection.text, fontSize: 11, fontWeight: 500, padding: "5px 12px", borderRadius: 20, fontFamily: F }}>CSC 301</span>
            <span style={{ fontSize: 13, color: T.textMuted, fontFamily: F }}>Just now</span>
          </div>
        </div>
      </div>
      <h2 style={{ margin: 0, fontFamily: F, fontSize: 22, fontWeight: 600, color: T.text }}>{heading}</h2>
      {subtitle && <p style={{ margin: "8px auto 0", fontSize: 15, color: T.textMuted, fontFamily: F, textAlign: "center", maxWidth: 320, lineHeight: 1.5 }}>{subtitle}</p>}
      {cta && (
        <button className="s-primary" type="button" onClick={onAdd} style={{ ...btnPrimary, marginTop: 26, display: "inline-flex", alignItems: "center", gap: 10, padding: "0 26px" }}>
          <Plus size={20} strokeWidth={2.4} /> {cta}
        </button>
      )}
    </div>
  );
}

function MiniCard({ left, top, rotate, z, opacity, title, type = "Document", showUrl, showTag, showMenu }) {
  const Icon = (CT[type] && CT[type].icon) || FileText;
  return (
    <div style={{ position: "absolute", left, top, width: 176, transform: `rotate(${rotate}deg)`, zIndex: z, opacity, background: "#fff", borderRadius: 12, border: `0.5px solid ${T.border}`, boxShadow: "0 12px 28px rgba(17,24,39,.10)", overflow: "hidden" }}>
      <div style={{ height: 78, background: T.brandLight, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={22} color={T.brandMid} strokeWidth={1.8} /></div>
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: T.text, lineHeight: 1.3, fontFamily: F, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 14 }}>{title}</div>
        {showUrl && <div style={{ height: 5, background: T.bg3, borderRadius: 3, marginTop: 8, width: "80%" }} />}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          {showTag ? <Pill type={type} /> : <span />}
          {showMenu && <MoreVertical size={12} color={T.textMuted} />}
        </div>
      </div>
    </div>
  );
}

/* collection card: name, count, preview fan from its resources; click opens detail */
function CollectionCard({ collection, items, onOpen, onSort, onRename, onDelete, onAdd }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(collection.name);
  const rots = [-6, -2, 2], ops = [0.45, 0.72, 1], lefts = ["6%", "30%", "44%"], tops = [50, 30, 44];
  return (
    <div style={{ position: "relative", borderRadius: 12 }}>
      <div className="coll-card" onClick={() => onOpen()} style={{ background: T.bg, borderRadius: 12, border: `0.5px solid ${T.border}`, boxShadow: T.shadowCard, padding: "22px 24px 0", height: 320, overflow: "hidden", cursor: "pointer" }}>
        <div style={{ textAlign: "center", paddingRight: 24, paddingLeft: 24 }}>
          {editing ? (
            <input autoFocus value={draft} onClick={(e) => e.stopPropagation()} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { onRename(draft.trim() || collection.name); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
              onBlur={() => { onRename(draft.trim() || collection.name); setEditing(false); }}
              style={{ width: "90%", textAlign: "center", fontSize: 13, fontWeight: 600, color: T.text, fontFamily: F, border: `1px solid ${T.brand}`, borderRadius: 8, padding: "6px 10px", outline: "none" }} />
          ) : (
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: F }}>{collection.name}</div>
          )}
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6, fontFamily: F }}>{items.length} resources</div>
        </div>
        <div style={{ position: "relative", height: 210, marginTop: 26, overflow: "hidden" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: 30 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: F }}>Nothing here yet</div>
              <p style={{ fontSize: 13, color: T.textMuted, margin: "6px auto 14px", maxWidth: 220, lineHeight: 1.5, fontFamily: F }}>Save a resource and assign it to this collection.</p>
              <button className="s-primary" type="button" onClick={(e) => { e.stopPropagation(); onAdd(); }} style={{ ...btnPrimary, height: 40, display: "inline-flex", alignItems: "center", gap: 8, padding: "0 18px", fontSize: 14 }}><Plus size={18} strokeWidth={2.4} /> Save resource</button>
            </div>
          ) : items.slice(0, 3).map((r, i) => (
            <MiniCard key={r.id} left={lefts[i]} top={tops[i]} rotate={rots[i]} z={i + 1} opacity={ops[i]} type={r.type} title={r.title} showUrl={i === items.slice(0, 3).length - 1} showTag={i === items.slice(0, 3).length - 1} showMenu={i === items.slice(0, 3).length - 1} />
          ))}
        </div>
      </div>
      <KebabMenu items={[
        { icon: <Sticker size={17} strokeWidth={1.8} />, label: "Sort Resource", onClick: onSort },
        { icon: <PenLine size={17} strokeWidth={1.8} />, label: "Edit Title", onClick: () => { setDraft(collection.name); setEditing(true); } },
        { icon: <Trash2 size={17} strokeWidth={1.8} />, label: "Delete Collection", danger: true, onClick: onDelete },
      ]} />
    </div>
  );
}

function LibraryView({ resources, collById, onAdd, ...handlers }) {
  if (resources.length === 0) return <EmptyState heading="Your library is empty" subtitle="Save links, articles and resources, they'll show up right here." cta="Save your first resource" onAdd={onAdd} />;
  return (
    <div style={{ padding: "32px 40px 60px" }}>
      <PageTitle badge={resources.length}>Library</PageTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {resources.map((r) => (
          <ResourceCard key={r.id} data={r} collectionName={collById[r.collectionId]} onOpen={() => handlers.onOpen(r)} onMove={() => handlers.onMove(r)} onRename={(t) => handlers.onRename(r.id, t)} onDelete={() => handlers.onDelete(r)} />
        ))}
        <AddCard onClick={onAdd} />
      </div>
    </div>
  );
}

function CollectionsView({ collections, resources, collById, go, onAdd, onSort, onRename, onDelete, onNewCollection, ...h }) {
  if (collections.length === 0) return <EmptyState heading="You haven't created any collections yet" cta="New collection" onAdd={onNewCollection} />;
  const unsorted = resources.filter((r) => !r.collectionId);
  return (
    <div style={{ padding: "32px 40px 70px" }}>
      <PageTitle badge={collections.length}>Collections</PageTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 28 }}>
        {collections.map((c) => (
          <CollectionCard key={c.id} collection={c} items={resources.filter((r) => r.collectionId === c.id)}
            onOpen={() => go({ name: "collection", id: c.id })} onSort={onSort} onRename={(n) => onRename(c.id, n)} onDelete={() => onDelete(c)} onAdd={() => onAdd(c.id)} />
        ))}
      </div>

      <div style={{ marginTop: 44 }}><PageTitle badge={unsorted.length}>Unsorted</PageTitle></div>
      {unsorted.length === 0 ? (
        <p style={{ fontSize: 15, color: T.textMuted, fontFamily: F }}>You&apos;re all organized.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {unsorted.map((r) => (
            <ResourceCard key={r.id} data={r} onOpen={() => h.onOpen(r)} onMove={() => h.onMove(r)} onRename={(t) => h.onRenameResource(r.id, t)} onDelete={() => h.onDeleteResource(r)} />
          ))}
        </div>
      )}
    </div>
  );
}

function BackButton({ onClick, label = "Collections" }) {
  return (
    <button type="button" onClick={onClick} className="link" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "4px 0", marginBottom: 16, cursor: "pointer", color: T.textSec, fontSize: 14, fontWeight: 500, fontFamily: F }}>
      <ArrowLeft size={18} strokeWidth={2} /> {label}
    </button>
  );
}

function CollectionDetailView({ collection, resources, collById, onAdd, onBack, ...h }) {
  const items = resources.filter((r) => r.collectionId === collection.id);
  return (
    <div style={{ padding: "32px 40px 60px" }}>
      <BackButton onClick={onBack} />
      {items.length === 0 ? (
        <EmptyState heading="This collection is empty" subtitle={`Save a resource to ${collection.name}.`} cta="Save resource" onAdd={() => onAdd(collection.id)} />
      ) : (
        <>
          <PageTitle badge={items.length}>{collection.name}</PageTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {items.map((r) => (
              <ResourceCard key={r.id} data={r} collectionName={collection.name} onOpen={() => h.onOpen(r)} onMove={() => h.onMove(r)} onRename={(t) => h.onRenameResource(r.id, t)} onDelete={() => h.onDeleteResource(r)} />
            ))}
            <AddCard onClick={() => onAdd(collection.id)} />
          </div>
        </>
      )}
    </div>
  );
}

function UnsortedView({ resources, onMove, ...h }) {
  const items = resources.filter((r) => !r.collectionId);
  if (items.length === 0) return <EmptyState heading="You're all organized" />;
  return (
    <div style={{ padding: "32px 40px 60px" }}>
      <PageTitle badge={items.length}>Unsorted</PageTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {items.map((r) => (
          <ResourceCard key={r.id} data={r} onOpen={() => h.onOpen(r)} onMove={() => onMove(r)} onRename={(t) => h.onRenameResource(r.id, t)} onDelete={() => h.onDeleteResource(r)}
            extraButton={
              <button className="s-primary" type="button" onClick={(e) => { e.stopPropagation(); onMove(r); }} style={{ ...btnPrimary, height: 40, marginTop: 14, width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 20, fontSize: 14 }}>
                Move to collection <ArrowRight size={17} strokeWidth={2.2} />
              </button>
            } />
        ))}
      </div>
    </div>
  );
}

/* ---- Modals ---- */
function ModalShell({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 50 }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width: "min(480px, 94vw)", maxHeight: "92vh", overflowY: "auto", background: T.bg, borderRadius: 12, boxShadow: T.shadowModal, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontFamily: F, fontSize: 22, fontWeight: 600, color: T.text }}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" style={{ width: 30, height: 30, borderRadius: "50%", border: `1.5px solid ${T.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.textSec }}><X size={16} strokeWidth={2} /></button>
        </div>
        <div style={{ height: 1, background: T.border, margin: "16px 0 22px" }} />
        {children}
      </div>
    </div>
  );
}
function FooterButtons({ onClose, saveLabel = "Save", onSave }) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
      <button type="button" onClick={onClose} className="s-secondary" style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
      <button type="button" onClick={onSave} className="s-primary" style={{ ...btnPrimary, flex: 1 }}>{saveLabel}</button>
    </div>
  );
}
function Chip({ icon, label, selected, onClick }) {
  return <button className="chip" type="button" onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", cursor: "pointer", padding: "9px 15px", borderRadius: 20, fontSize: 14, fontWeight: 500, fontFamily: F, background: selected ? T.brand : T.bg, color: selected ? "#fff" : T.text, border: `1px solid ${selected ? T.brand : T.border}` }}>{icon}{label}</button>;
}
function detectType(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (/(youtube\.com|youtu\.be|vimeo\.com|loom\.com)/.test(u)) return "Video";
  if (/(soundcloud\.com|spotify\.com)/.test(u)) return "Audio";
  if (/(instagram\.com|unsplash\.com|pinterest\.com)/.test(u)) return "Image";
  if (/(drive\.google\.com|dropbox\.com|notion\.so)/.test(u)) return "Document";
  if (/\.[a-z]{2,}/.test(u)) return "Article";
  return null;
}
function SaveResourceModal({ onClose, onSave, prefillCollectionId }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState(null);
  const [touched, setTouched] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [collection, setCollection] = useState("");
  useEffect(() => { if (!touched) setType(detectType(url)); }, [url, touched]);
  const types = [
    { key: "Article", icon: <BookOpen size={18} strokeWidth={1.9} /> },
    { key: "Video", icon: <Video size={18} strokeWidth={1.9} /> },
    { key: "Audio", icon: <Headphones size={18} strokeWidth={1.9} /> },
    { key: "Image", icon: <ImageIcon size={18} strokeWidth={1.9} /> },
    { key: "Document", icon: <FileText size={18} strokeWidth={1.9} /> },
  ];
  const save = () => {
    if (!url.trim()) return;
    onSave({ url: url.trim(), title: title.trim(), type: type || "Article", newCollectionName: showCollection ? collection.trim() : "", prefillCollectionId });
    onClose();
  };
  return (
    <ModalShell title="Save Resource" onClose={onClose}>
      <label style={labelBase}>URL</label>
      <input className="s-input" style={inputBase} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" autoFocus />
      <div style={{ marginTop: 20 }}>
        <label style={labelBase}>Title</label>
        <input className="s-input" style={inputBase} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter a custom title (optional)" />
        <p style={helperBase}>Leave blank to use the page title</p>
      </div>
      <div style={{ marginTop: 20 }}>
        <label style={{ ...labelBase, marginBottom: 4 }}>Content type</label>
        <span style={{ display: "inline-block", fontSize: 12.5, fontStyle: "italic", color: T.brand, textDecoration: "underline", textUnderlineOffset: 3, fontFamily: F, marginBottom: 14 }}>Auto-detected, change if you want</span>
        <div className="chips-row" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {types.map((t) => <Chip key={t.key} icon={t.icon} label={t.key} selected={type === t.key} onClick={() => { setTouched(true); setType(t.key); }} />)}
        </div>
      </div>
      {showCollection && (
        <div style={{ marginTop: 22 }}>
          <label style={labelBase}>Collection</label>
          <input className="s-input" style={inputBase} value={collection} onChange={(e) => setCollection(e.target.value)} placeholder="Enter a custom collection (optional)" />
          <p style={helperBase}>You can always organize later.</p>
        </div>
      )}
      <button type="button" onClick={() => setShowCollection(true)} className="link" style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: 0, cursor: "pointer", color: T.brand, fontSize: 15, fontWeight: 600, fontFamily: F }}>
        <Plus size={20} strokeWidth={2.2} /> Create new collection
      </button>
      <FooterButtons onClose={onClose} onSave={save} />
    </ModalShell>
  );
}
function NewCollectionModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  return (
    <ModalShell title="New Collection" onClose={onClose}>
      <label style={labelBase}>Collection name</label>
      <input className="s-input" style={inputBase} value={name} onChange={(e) => setName(e.target.value)} placeholder="E.g Design Resources" autoFocus />
      <p style={helperBase}>Give your collection a clear, memorable name.</p>
      <FooterButtons onClose={onClose} onSave={() => { if (name.trim()) { onCreate(name.trim()); onClose(); } }} />
    </ModalShell>
  );
}
function MoveModal({ collections, onClose, onMove }) {
  const [value, setValue] = useState(null);
  const [open, setOpen] = useState(false);
  return (
    <ModalShell title="Sort Resource" onClose={onClose}>
      <label style={labelBase}>Collection name</label>
      <div style={{ position: "relative" }}>
        <button type="button" onClick={() => setOpen((o) => !o)} style={{ ...inputBase, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left", color: value ? T.text : T.placeholder }}>
          <span>{value ? value.name : "E.g Design Resources"}</span>
          <ChevronDown size={20} strokeWidth={2} color={T.textMuted} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s ease" }} />
        </button>
        {open && (
          <div style={{ position: "absolute", top: 50, left: 0, right: 0, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, boxShadow: T.shadowModal, overflow: "hidden", zIndex: 5 }}>
            {collections.length === 0 && <div style={{ padding: "12px 16px", fontSize: 13, color: T.textMuted, fontFamily: F }}>No collections yet</div>}
            {collections.map((c) => <button key={c.id} type="button" className="dd-item" onClick={() => { setValue(c); setOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 16px", border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: T.text, fontFamily: F }}>{c.name}</button>)}
          </div>
        )}
      </div>
      <p style={helperBase}>Choose a collection to move this resource into.</p>
      <FooterButtons onClose={onClose} onSave={() => { if (value) { onMove(value.id, value.name); onClose(); } }} />
    </ModalShell>
  );
}
function RadioOption({ selected, label, description, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ display: "flex", gap: 14, alignItems: "flex-start", width: "100%", textAlign: "left", background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 18px", cursor: "pointer", fontFamily: F }}>
      <span style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${T.brand}`, flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>{selected && <span style={{ width: 10, height: 10, borderRadius: "50%", background: T.brand }} />}</span>
      <span><span style={{ display: "block", fontSize: 12.5, color: T.textMuted, marginBottom: 4 }}>{label}</span><span style={{ display: "block", fontSize: 15, color: T.text, lineHeight: 1.45 }}>{description}</span></span>
    </button>
  );
}
function DeleteCollectionModal({ name, count, onClose, onConfirm }) {
  const [choice, setChoice] = useState("safe");
  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 50 }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width: "min(532px, 94vw)", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 16, boxShadow: T.shadowModal, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: F, fontSize: 22, fontWeight: 700, color: T.text }}>Delete &ldquo;{name}&rdquo;</h2>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: T.textMuted, fontFamily: F }}>Choose what happens to the resources inside this collection.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ width: 30, height: 30, borderRadius: "50%", border: `1.5px solid ${T.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.textSec, flexShrink: 0, marginLeft: 12 }}><X size={16} strokeWidth={2} /></button>
        </div>
        <div style={{ height: 1, background: T.border, margin: "18px 0 22px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <RadioOption selected={choice === "safe"} onClick={() => setChoice("safe")} label="Delete collection only" description={<>All {count} resources will be moved to Unsorted. You can reorganize them later.</>} />
          <RadioOption selected={choice === "destructive"} onClick={() => setChoice("destructive")} label="Delete collection and all resources" description={<>All {count} resources will be permanently deleted. This cannot be undone.</>} />
        </div>
        {choice === "destructive" && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 18, padding: "14px 16px", borderRadius: 10, border: `1px solid ${T.error}`, background: "#fff" }}>
            <AlertTriangle size={18} color={T.error} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 14, color: T.error, fontFamily: F, lineHeight: 1.45 }}>You are about to permanently delete {count} resources. This action cannot be reversed.</span>
          </div>
        )}
        <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, height: 48, borderRadius: 10, border: `1.5px solid ${T.brand}`, background: "#fff", color: T.brand, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: F }}>Cancel</button>
          <button type="button" onClick={() => onConfirm(choice)} style={{ flex: 1, height: 48, borderRadius: 10, border: "none", cursor: "pointer", background: T.error, color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: F }}>{choice === "destructive" ? "Delete everything" : "Delete collection"}</button>
        </div>
      </div>
    </div>
  );
}
function ConfirmModal({ title, message, confirmLabel, onClose, onConfirm }) {
  return (
    <ModalShell title={title} onClose={onClose}>
      <p style={{ margin: 0, fontSize: 14.5, color: T.textSec, fontFamily: F, lineHeight: 1.55 }}>{message}</p>
      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        <button type="button" onClick={onClose} className="s-secondary" style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
        <button type="button" onClick={onConfirm} style={{ flex: 1, height: 44, borderRadius: 8, border: "none", cursor: "pointer", background: T.error, color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: F }}>{confirmLabel}</button>
      </div>
    </ModalShell>
  );
}

function Toasts({ toasts }) {
  return (
    <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 70, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
      {toasts.map((t) => <div key={t.id} className="toast" style={{ width: 320, minHeight: 48, background: T.text, color: "#fff", borderRadius: 8, display: "flex", alignItems: "center", padding: "0 16px", fontSize: 14, fontWeight: 500, fontFamily: F, boxShadow: "0 8px 24px rgba(0,0,0,.25)" }}>{t.msg}</div>)}
    </div>
  );
}

let _id = 100;
const uid = (p) => `${p}${++_id}`;

const SEED_COLLECTIONS = [
  { id: "c1", name: "CSC 301 - Data Structures" },
  { id: "c2", name: "Past Question" },
  { id: "c3", name: "Coding Resources" },
];
const SEED_RESOURCES = [
  { id: "r1", title: "How to implement a binary search tree in Python", url: "https://youtube.com/watch?v=dQw4w9WgXcQ", type: "Video", collectionId: "c1", time: "2h ago" },
  { id: "r2", title: "HCSC 301 past questions — 2019 to 2023 compiled", url: "https://drive.google.com/file/d/1BxiMVsdsdwd", type: "Document", collectionId: null, time: "2h ago" },
  { id: "r3", title: "Binary search trees — insertion, deletion and traversal explained", url: "https://youtube.com/watch?v=bum4s8BtD1Y", type: "Document", collectionId: "c2", time: "3h ago" },
  { id: "r4", title: "How to retract a Hex search tree in Python", url: "https://youtube.com/watch?v=dQw4w9WgXcQ", type: "Video", collectionId: "c1", time: "2h ago" },
];

function HomeApp({ token, onSignOut }) {
  const live = !!token; // authenticated against the backend
  const [route, setRoute] = useState({ name: "library" });
  const [collections, setCollections] = useState(live ? [] : SEED_COLLECTIONS);
  const [resources, setResources] = useState(live ? [] : SEED_RESOURCES);
  const [loading, setLoading] = useState(live);
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toast = (msg) => { const id = Date.now() + Math.random(); setToasts((t) => [...t, { id, msg }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000); };
  const syncFail = () => toast("Couldn't reach the server — change kept locally");

  /* load library from backend on mount (authenticated only) */
  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    (async () => {
      try {
        const [cols, res] = await Promise.all([api.listCollections(token), api.listResources(token)]);
        if (cancelled) return;
        setCollections(cols);
        setResources(res);
      } catch (e) {
        if (cancelled) return;
        setCollections(SEED_COLLECTIONS);
        setResources(SEED_RESOURCES);
        toast("Couldn't load your library from the server — showing sample data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [live, token]);

  const collById = Object.fromEntries(collections.map((c) => [c.id, c.name]));
  const unsortedCount = resources.filter((r) => !r.collectionId).length;

  /* actions (optimistic local update + best-effort server sync when authenticated) */
  const openUrl = (r) => { try { window.open(r.url.startsWith("http") ? r.url : `https://${r.url}`, "_blank", "noopener,noreferrer"); } catch (e) {} };

  const createCollection = async (name) => {
    if (live) {
      try { const c = await api.createCollection(name, token); setCollections((cs) => [...cs, c]); toast("Collection created"); return c.id; }
      catch (e) { syncFail(); }
    }
    const id = uid("c"); setCollections((cs) => [...cs, { id, name }]); toast("Collection created"); return id;
  };

  const saveResource = async ({ url, title, type, newCollectionName, prefillCollectionId }) => {
    let collectionId = prefillCollectionId || null;
    if (newCollectionName) {
      if (live) { try { const c = await api.createCollection(newCollectionName, token); setCollections((cs) => [...cs, c]); collectionId = c.id; } catch (e) { syncFail(); const id = uid("c"); setCollections((cs) => [...cs, { id, name: newCollectionName }]); collectionId = id; } }
      else { const id = uid("c"); setCollections((cs) => [...cs, { id, name: newCollectionName }]); collectionId = id; }
    }
    const t = title || url.replace(/^https?:\/\//, "").slice(0, 44);
    if (live) {
      try { const r = await api.createResource({ url, title: t, type, collectionId }, token); setResources((rs) => [r, ...rs]); toast("Resource saved"); return; }
      catch (e) { syncFail(); }
    }
    setResources((rs) => [{ id: uid("r"), title: t, url, type, collectionId, time: "Just now" }, ...rs]);
    toast("Resource saved");
  };

  const moveResource = (resourceId, collectionId, collectionName) => {
    setResources((rs) => rs.map((r) => (r.id === resourceId ? { ...r, collectionId } : r)));
    toast(`Resource moved to ${collectionName}`);
    if (live) api.updateResource(resourceId, { collectionId }, token).catch(syncFail);
  };

  const renameCollection = (id, name) => {
    setCollections((cs) => cs.map((c) => (c.id === id ? { ...c, name } : c)));
    toast("Collection renamed");
    if (live) api.renameCollection(id, name, token).catch(syncFail);
  };

  const deleteCollection = (id, choice) => {
    if (choice === "destructive") setResources((rs) => rs.filter((r) => r.collectionId !== id));
    else setResources((rs) => rs.map((r) => (r.collectionId === id ? { ...r, collectionId: null } : r)));
    setCollections((cs) => cs.filter((c) => c.id !== id));
    if (route.name === "collection" && route.id === id) setRoute({ name: "collections" });
    toast("Collection deleted");
    if (live) api.deleteCollection(id, choice === "destructive" ? "destructive" : "safe", token).catch(syncFail);
  };

  const renameResource = (id, title) => {
    setResources((rs) => rs.map((r) => (r.id === id ? { ...r, title } : r)));
    if (live) api.updateResource(id, { title }, token).catch(syncFail);
  };

  const deleteResource = (id) => {
    setResources((rs) => rs.filter((r) => r.id !== id));
    toast("Resource deleted");
    if (live) api.deleteResource(id, token).catch(syncFail);
  };

  /* modal openers */
  const openSave = (prefillCollectionId) => setModal({ type: "save", prefillCollectionId: typeof prefillCollectionId === "string" ? prefillCollectionId : undefined });
  const openMove = (r) => setModal({ type: "move", resource: r });
  const openDeleteCollection = (c) => setModal({ type: "deleteCollection", collection: c });
  const openDeleteResource = (r) => setModal({ type: "deleteResource", resource: r });

  const sharedHandlers = { onOpen: openUrl, onMove: openMove, onRenameResource: renameResource, onDeleteResource: openDeleteResource };
  const activeCollection = route.name === "collection" ? collections.find((c) => c.id === route.id) : null;

  return (
    <div className="stash" style={{ display: "flex", minHeight: "100vh", background: T.bg2 }}>
      <style>{CSS}</style>
      <Sidebar route={route} go={setRoute} collections={collections} unsortedCount={unsortedCount} onNewCollection={() => setModal({ type: "newCollection" })} onSignOut={onSignOut} />
      <main style={{ flex: 1, minWidth: 0 }}>
        {loading ? (
          <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, fontFamily: F, fontSize: 15 }}>Loading your library…</div>
        ) : (
        <>
        {route.name === "library" && (
          <LibraryView resources={resources} collById={collById} onAdd={() => openSave()} onOpen={openUrl} onMove={openMove} onRename={renameResource} onDelete={openDeleteResource} />
        )}
        {route.name === "collections" && (
          <CollectionsView collections={collections} resources={resources} collById={collById} go={setRoute}
            onAdd={(cid) => openSave(cid)} onSort={() => openMove(null)} onRename={renameCollection} onDelete={openDeleteCollection} onNewCollection={() => setModal({ type: "newCollection" })} {...sharedHandlers} />
        )}
        {route.name === "collection" && activeCollection && (
          <CollectionDetailView collection={activeCollection} resources={resources} collById={collById} onAdd={(cid) => openSave(cid)} onBack={() => setRoute({ name: "collections" })} {...sharedHandlers} />
        )}
        {route.name === "collection" && !activeCollection && <EmptyState heading="Collection not found" />}
        {route.name === "unsorted" && (
          <UnsortedView resources={resources} onMove={openMove} {...sharedHandlers} />
        )}
        </>
        )}
      </main>

      {modal?.type === "save" && <SaveResourceModal onClose={() => setModal(null)} onSave={saveResource} prefillCollectionId={modal.prefillCollectionId} />}
      {modal?.type === "newCollection" && <NewCollectionModal onClose={() => setModal(null)} onCreate={createCollection} />}
      {modal?.type === "move" && <MoveModal collections={collections} onClose={() => setModal(null)} onMove={(cid, cname) => { if (modal.resource) moveResource(modal.resource.id, cid, cname); else toast(`Resource moved to ${cname}`); }} />}
      {modal?.type === "deleteCollection" && <DeleteCollectionModal name={modal.collection.name} count={resources.filter((r) => r.collectionId === modal.collection.id).length} onClose={() => setModal(null)} onConfirm={(choice) => { deleteCollection(modal.collection.id, choice); setModal(null); }} />}
      {modal?.type === "deleteResource" && <ConfirmModal title="Delete Resource" message="This resource will be permanently removed from your library. This cannot be undone." confirmLabel="Delete resource" onClose={() => setModal(null)} onConfirm={() => { deleteResource(modal.resource.id); setModal(null); }} />}

      <Toasts toasts={toasts} />
    </div>
  );
}

/* ========================= ROOT ========================= */
export default function StashApp() {
  const [session, setSession] = useState(null); // { token, user, online } | null
  return session
    ? <HomeApp token={session.token} onSignOut={() => setSession(null)} />
    : <AuthFlow onAuthed={(s) => setSession(s)} />;
}
