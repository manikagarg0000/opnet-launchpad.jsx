import { useState, useEffect, useRef } from "react";

// ── Palette & design tokens ──────────────────────────────────────────────────
const C = {
  bg: "#050810",
  surface: "#0b1120",
  surfaceHi: "#111c30",
  border: "#1a2a45",
  borderHi: "#1e3a5f",
  accent: "#00c2ff",
  accentDim: "#0077aa",
  orange: "#ff6b2b",
  green: "#00e68a",
  purple: "#8b5cf6",
  red: "#ff3b5c",
  textPrimary: "#e8f0fe",
  textSecondary: "#7a9bc0",
  textDim: "#3a5070",
};

// ── Utility helpers ──────────────────────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString();
const shortAddr = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ── Fake data ────────────────────────────────────────────────────────────────
const MOCK_PRESALES = [
  { id: 1, name: "BitOrb", ticker: "BORB", raised: 78400, goal: 100000, investors: 214, end: "2d 14h", logo: "🔮", status: "live" },
  { id: 2, name: "NeonFi", ticker: "NEON", raised: 52000, goal: 80000, investors: 163, end: "5d 3h", logo: "⚡", status: "live" },
  { id: 3, name: "SatoshiVault", ticker: "SVLT", raised: 120000, goal: 120000, investors: 389, end: "Ended", logo: "🏛️", status: "filled" },
  { id: 4, name: "OmniLayer", ticker: "OMNI", raised: 12000, goal: 200000, investors: 47, end: "12d 6h", logo: "🌐", status: "live" },
];

const MOCK_TXS = [
  { hash: "bc1q9xf3…a8d2", type: "Deploy", token: "BORB", amount: "21,000,000", time: "2m ago", status: "confirmed" },
  { hash: "bc1qm7k2…f3c1", type: "Presale Buy", token: "NEON", amount: "0.5 BTC", time: "7m ago", status: "confirmed" },
  { hash: "bc1q3lp8…b9e4", type: "Lock LP", token: "SVLT/BTC", amount: "180 days", time: "15m ago", status: "confirmed" },
  { hash: "bc1qd4j5…7ab3", type: "Stake", token: "OMNI", amount: "50,000", time: "22m ago", status: "confirmed" },
  { hash: "bc1q8rs1…c2f0", type: "OTC Escrow", token: "BORB", amount: "10,000 BORB", time: "41m ago", status: "pending" },
  { hash: "bc1q6wt4…a1d8", type: "Vest Claim", token: "SVLT", amount: "2,500", time: "1h ago", status: "confirmed" },
];

const MOCK_INVESTORS = [
  { addr: "bc1qaz…3wsx", amount: "2.4 BTC", tokens: "240,000", time: "3m ago" },
  { addr: "bc1qmx…7lkj", amount: "1.1 BTC", tokens: "110,000", time: "18m ago" },
  { addr: "bc1qpn…9ert", amount: "0.8 BTC", tokens: "80,000", time: "35m ago" },
  { addr: "bc1qvb…4uio", amount: "3.2 BTC", tokens: "320,000", time: "1h ago" },
  { addr: "bc1qcd…1qaz", amount: "0.5 BTC", tokens: "50,000", time: "2h ago" },
];

// ── Shared UI components ─────────────────────────────────────────────────────
const Badge = ({ children, color = C.accent }) => (
  <span style={{
    background: `${color}22`, color, border: `1px solid ${color}44`,
    borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.06em", textTransform: "uppercase",
  }}>{children}</span>
);

const Card = ({ children, style = {}, glow = false }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: 24,
    boxShadow: glow ? `0 0 32px ${C.accent}18, 0 2px 12px #00000080` : "0 2px 12px #00000060",
    transition: "box-shadow .3s",
    ...style
  }}>{children}</div>
);

const Input = ({ label, value, onChange, placeholder, type = "text", hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", color: C.textSecondary, fontSize: 12, fontWeight: 600,
      letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: "10px 14px", color: C.textPrimary,
        fontSize: 14, outline: "none", boxSizing: "border-box",
        fontFamily: "inherit", transition: "border-color .2s",
      }}
      onFocus={e => e.target.style.borderColor = C.accent}
      onBlur={e => e.target.style.borderColor = C.border}
    />
    {hint && <p style={{ color: C.textDim, fontSize: 11, marginTop: 4 }}>{hint}</p>}
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", color: C.textSecondary, fontSize: 12, fontWeight: 600,
      letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: "10px 14px", color: C.textPrimary,
        fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
      }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", style = {}, disabled = false }) => {
  const [hover, setHover] = useState(false);
  const base = {
    primary: { bg: C.accent, color: C.bg, border: "none" },
    secondary: { bg: "transparent", color: C.accent, border: `1px solid ${C.accent}` },
    danger: { bg: "transparent", color: C.red, border: `1px solid ${C.red}` },
    success: { bg: C.green, color: C.bg, border: "none" },
    orange: { bg: C.orange, color: "#fff", border: "none" },
  }[variant];
  const pad = size === "sm" ? "7px 14px" : size === "lg" ? "14px 28px" : "10px 20px";
  const fs = size === "sm" ? 12 : size === "lg" ? 16 : 14;
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: base.bg, color: base.color, border: base.border,
        borderRadius: 8, padding: pad, fontSize: fs, fontWeight: 700,
        letterSpacing: "0.04em", cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : hover ? 0.85 : 1,
        transition: "all .18s", fontFamily: "inherit",
        ...style
      }}
    >{children}</button>
  );
};

const ProgressBar = ({ value, max, color = C.accent }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ background: C.bg, borderRadius: 999, height: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <div style={{
        width: `${pct}%`, height: "100%",
        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        borderRadius: 999, transition: "width 1s ease",
        boxShadow: `0 0 8px ${color}80`,
      }} />
    </div>
  );
};

const StatBox = ({ label, value, sub, color = C.textPrimary }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ color, fontSize: 22, fontWeight: 800, fontFamily: "'Orbitron', monospace" }}>{value}</div>
    <div style={{ color: C.textSecondary, fontSize: 11, marginTop: 2 }}>{label}</div>
    {sub && <div style={{ color: C.textDim, fontSize: 10, marginTop: 2 }}>{sub}</div>}
  </div>
);

const SectionHeader = ({ title, subtitle, icon }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.textPrimary,
        fontFamily: "'Orbitron', monospace", letterSpacing: "0.05em" }}>{title}</h2>
    </div>
    {subtitle && <p style={{ margin: 0, color: C.textSecondary, fontSize: 13 }}>{subtitle}</p>}
  </div>
);

const Divider = () => <div style={{ height: 1, background: C.border, margin: "20px 0" }} />;

const PulsingDot = ({ color = C.green }) => (
  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%",
    background: color, boxShadow: `0 0 6px ${color}`, marginRight: 6,
    animation: "pulse 1.5s infinite" }} />
);

// ── MODULE: Token Deploy Wizard ───────────────────────────────────────────────
function TokenWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", ticker: "", supply: "", decimals: "8",
    mintable: false, burnable: false, description: "", logo: "" });
  const [deploying, setDeploying] = useState(false);
  const [done, setDone] = useState(false);

  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const deploy = () => {
    if (!form.name || !form.ticker || !form.supply) return;
    setDeploying(true);
    setTimeout(() => { setDeploying(false); setDone(true); }, 2400);
  };

  if (done) return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
      <h3 style={{ color: C.green, fontFamily: "'Orbitron', monospace", marginBottom: 8 }}>Token Deployed!</h3>
      <p style={{ color: C.textSecondary, marginBottom: 4 }}><strong style={{ color: C.textPrimary }}>{form.name} ({form.ticker})</strong> is live on OP_NET</p>
      <p style={{ color: C.textDim, fontSize: 12, marginBottom: 24 }}>Supply: {fmt(form.supply)} · Contract: bc1q…{form.ticker.toLowerCase()}2024</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Btn variant="primary" onClick={() => { setDone(false); setStep(1); setForm({ name:"",ticker:"",supply:"",decimals:"8",mintable:false,burnable:false,description:"",logo:"" }); }}>Deploy Another</Btn>
        <Btn variant="secondary">View on OP_SCAN ↗</Btn>
      </div>
    </div>
  );

  return (
    <div>
      <SectionHeader title="Token Deploy Wizard" subtitle="No-code OP_20 token deployment in minutes" icon="🚀" />

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 0, marginBottom: 32 }}>
        {["Token Info", "Settings", "Review"].map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 12, fontWeight: 800,
                  background: step > i + 1 ? C.green : step === i + 1 ? C.accent : C.surfaceHi,
                  color: step >= i + 1 ? C.bg : C.textDim,
                  border: step === i + 1 ? `2px solid ${C.accent}` : "2px solid transparent",
                  transition: "all .3s",
                }}>{step > i + 1 ? "✓" : i + 1}</div>
                <span style={{ fontSize: 12, color: step === i + 1 ? C.accent : C.textDim, fontWeight: 600 }}>{s}</span>
              </div>
              {i < 2 && <div style={{ height: 2, background: step > i + 1 ? C.green : C.border, marginTop: 12, marginLeft: 28 }} />}
            </div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Input label="Token Name" value={form.name} onChange={f("name")} placeholder="e.g. SatoshiVault" />
          </div>
          <Input label="Ticker Symbol" value={form.ticker} onChange={f("ticker")} placeholder="e.g. SVLT" hint="2–6 uppercase characters" />
          <Input label="Total Supply" value={form.supply} onChange={f("supply")} placeholder="e.g. 21000000" type="number" />
          <Select label="Decimals" value={form.decimals} onChange={f("decimals")}
            options={[{value:"8",label:"8 (BTC-like)"},{value:"6",label:"6"},{value:"18",label:"18 (EVM-like)"}]} />
          <div style={{ gridColumn: "1 / -1" }}>
            <Input label="Description (optional)" value={form.description} onChange={f("description")} placeholder="What is your project about?" />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
            <Btn onClick={() => setStep(2)} disabled={!form.name || !form.ticker || !form.supply}>Next: Settings →</Btn>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p style={{ color: C.textSecondary, fontSize: 13, marginBottom: 20 }}>Configure token behaviours and permissions.</p>
          {[["mintable","🔨 Mintable","Allow future minting by owner"],
            ["burnable","🔥 Burnable","Allow token holders to burn supply"]].map(([k, label, desc]) => (
            <div key={k} onClick={() => setForm(p => ({ ...p, [k]: !p[k] }))}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                background: form[k] ? `${C.accent}11` : C.bg, border: `1px solid ${form[k] ? C.accent : C.border}`,
                borderRadius: 10, padding: "14px 18px", marginBottom: 12, cursor: "pointer", transition: "all .2s" }}>
              <div>
                <div style={{ color: C.textPrimary, fontWeight: 600, fontSize: 14 }}>{label}</div>
                <div style={{ color: C.textSecondary, fontSize: 12 }}>{desc}</div>
              </div>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: form[k] ? C.accent : C.border,
                position: "relative", transition: "background .2s" }}>
                <div style={{ position: "absolute", top: 3, left: form[k] ? 22 : 3, width: 18, height: 18,
                  borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
            <Btn variant="secondary" onClick={() => setStep(1)}>← Back</Btn>
            <Btn onClick={() => setStep(3)}>Next: Review →</Btn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <Card style={{ background: C.bg, marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Name", form.name], ["Ticker", form.ticker],
                ["Supply", fmt(form.supply)], ["Decimals", form.decimals],
                ["Mintable", form.mintable ? "Yes" : "No"], ["Burnable", form.burnable ? "Yes" : "No"]
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: C.textDim, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{k}</div>
                  <div style={{ color: C.textPrimary, fontWeight: 600, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
          <div style={{ background: `${C.orange}15`, border: `1px solid ${C.orange}44`, borderRadius: 10,
            padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span>⚠️</span>
            <p style={{ margin: 0, color: C.orange, fontSize: 12 }}>Estimated deploy fee: ~0.0003 BTC. Ensure your wallet is connected and funded.</p>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setStep(2)}>← Back</Btn>
            <Btn variant="success" onClick={deploy} disabled={deploying} size="lg">
              {deploying ? "⏳ Deploying…" : "🚀 Deploy Token"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MODULE: Presale Dashboard ─────────────────────────────────────────────────
function PresaleDashboard() {
  const [selected, setSelected] = useState(null);
  const [investAmt, setInvestAmt] = useState("");
  const [invested, setInvested] = useState(false);

  if (selected) {
    const p = MOCK_PRESALES.find(x => x.id === selected);
    const pct = Math.round((p.raised / p.goal) * 100);
    return (
      <div>
        <button onClick={() => { setSelected(null); setInvested(false); setInvestAmt(""); }}
          style={{ background: "none", border: "none", color: C.accent, cursor: "pointer",
            fontSize: 13, marginBottom: 20, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
          ← Back to Presales
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{ fontSize: 40 }}>{p.logo}</div>
          <div>
            <h2 style={{ margin: 0, color: C.textPrimary, fontFamily: "'Orbitron', monospace" }}>{p.name}</h2>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Badge color={C.accent}>{p.ticker}</Badge>
              <Badge color={p.status === "live" ? C.green : C.textDim}>{p.status === "live" ? "🟢 LIVE" : "✅ FILLED"}</Badge>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[["Raised", `$${fmt(p.raised)}`], ["Goal", `$${fmt(p.goal)}`],
            ["Investors", fmt(p.investors)], ["Ends", p.end]].map(([l, v]) => (
            <Card key={l} style={{ padding: 16, textAlign: "center" }}>
              <div style={{ color: C.accent, fontSize: 18, fontWeight: 800, fontFamily: "'Orbitron', monospace" }}>{v}</div>
              <div style={{ color: C.textSecondary, fontSize: 11, marginTop: 4 }}>{l}</div>
            </Card>
          ))}
        </div>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: C.textSecondary, fontSize: 13 }}>Presale Progress</span>
            <span style={{ color: C.accent, fontWeight: 700, fontFamily: "monospace" }}>{pct}%</span>
          </div>
          <ProgressBar value={p.raised} max={p.goal} color={pct >= 100 ? C.green : C.accent} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ color: C.textDim, fontSize: 11 }}>$0</span>
            <span style={{ color: C.textDim, fontSize: 11 }}>${fmt(p.goal)}</span>
          </div>
        </Card>
        {p.status === "live" && !invested && (
          <Card style={{ marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px", color: C.textPrimary, fontSize: 15 }}>Participate in Presale</h3>
            <Input label="Investment Amount (BTC)" value={investAmt} onChange={setInvestAmt} placeholder="0.0" type="number" hint="Min: 0.01 BTC · Max: 5 BTC" />
            {investAmt && <p style={{ color: C.textDim, fontSize: 12, marginBottom: 12 }}>You receive: ~{fmt(Math.floor(parseFloat(investAmt || 0) * 100000))} {p.ticker}</p>}
            <Btn variant="success" size="lg" onClick={() => setInvested(true)} disabled={!investAmt || parseFloat(investAmt) < 0.01}>
              🔐 Contribute {investAmt ? `${investAmt} BTC` : ""}
            </Btn>
          </Card>
        )}
        {invested && (
          <div style={{ background: `${C.green}15`, border: `1px solid ${C.green}44`, borderRadius: 10,
            padding: "16px 20px", marginBottom: 20, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <p style={{ color: C.green, fontWeight: 700, margin: "0 0 4px" }}>Investment confirmed!</p>
            <p style={{ color: C.textSecondary, fontSize: 12, margin: 0 }}>Your {p.ticker} tokens will unlock at TGE.</p>
          </div>
        )}
        <Card>
          <h3 style={{ margin: "0 0 16px", color: C.textPrimary, fontSize: 15 }}>Recent Investors</h3>
          {MOCK_INVESTORS.map((inv, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: i < MOCK_INVESTORS.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.surfaceHi,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                  {["👤","🦊","🐋","💎","🤖"][i]}
                </div>
                <div>
                  <div style={{ color: C.textPrimary, fontSize: 13, fontFamily: "monospace" }}>{inv.addr}</div>
                  <div style={{ color: C.textDim, fontSize: 11 }}>{inv.time}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: C.orange, fontSize: 13, fontWeight: 700 }}>{inv.amount}</div>
                <div style={{ color: C.textDim, fontSize: 11 }}>→ {inv.tokens} {p.ticker}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Presale Dashboard" subtitle="Discover and participate in live token presales" icon="📊" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {MOCK_PRESALES.map(p => {
          const pct = Math.round((p.raised / p.goal) * 100);
          return (
            <Card key={p.id} style={{ cursor: "pointer", transition: "all .2s" }}
              onClick={() => setSelected(p.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 28 }}>{p.logo}</span>
                  <div>
                    <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                    <Badge color={C.accent}>{p.ticker}</Badge>
                  </div>
                </div>
                <Badge color={p.status === "live" ? C.green : C.textDim}>
                  {p.status === "live" ? "LIVE" : "FILLED"}
                </Badge>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: C.textSecondary, fontSize: 12 }}>${fmt(p.raised)} raised</span>
                  <span style={{ color: C.accent, fontSize: 12, fontWeight: 700 }}>{pct}%</span>
                </div>
                <ProgressBar value={p.raised} max={p.goal} color={pct >= 100 ? C.green : C.accent} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.textDim, fontSize: 12 }}>👥 {fmt(p.investors)} investors</span>
                <span style={{ color: p.status === "live" ? C.orange : C.textDim, fontSize: 12 }}>⏱ {p.end}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── MODULE: Vesting Schedule ──────────────────────────────────────────────────
function VestingDashboard() {
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState({ token: "", beneficiary: "", amount: "", vestType: "linear",
    cliffMonths: "3", durationMonths: "12", schedule: "" });
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  const [created, setCreated] = useState(false);

  const SAMPLE_VESTS = [
    { token: "SVLT", benef: "bc1q9xf3…a8d2", total: "500,000", claimed: "125,000", pct: 25, type: "linear", ends: "9 months" },
    { token: "BORB", benef: "bc1qm7k2…f3c1", total: "1,200,000", claimed: "0", pct: 0, type: "cliff", ends: "Cliff in 30d" },
  ];

  return (
    <div>
      <SectionHeader title="Vesting Schedules" subtitle="Create transparent token vesting for teams, investors, and advisors" icon="📅" />
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["create", "active"].map(m => (
          <Btn key={m} variant={mode === m ? "primary" : "secondary"} size="sm" onClick={() => setMode(m)}>
            {m === "create" ? "➕ Create Schedule" : "📋 Active Schedules"}
          </Btn>
        ))}
      </div>

      {mode === "create" && !created && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Token Contract" value={form.token} onChange={f("token")} placeholder="bc1q…token" />
          <Input label="Beneficiary Address" value={form.beneficiary} onChange={f("beneficiary")} placeholder="bc1q…wallet" />
          <Input label="Total Amount" value={form.amount} onChange={f("amount")} placeholder="1000000" type="number" />
          <Select label="Vesting Type" value={form.vestType} onChange={f("vestType")}
            options={[{value:"linear",label:"📈 Linear"},{value:"cliff",label:"🪨 Cliff + Linear"},{value:"custom",label:"🎛 Custom Milestone"}]} />
          {(form.vestType === "linear" || form.vestType === "cliff") && <>
            {form.vestType === "cliff" && <Input label="Cliff Period (months)" value={form.cliffMonths} onChange={f("cliffMonths")} type="number" />}
            <Input label={`${form.vestType === "cliff" ? "Vesting " : ""}Duration (months)`} value={form.durationMonths} onChange={f("durationMonths")} type="number" />
          </>}
          {form.vestType === "custom" && (
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Custom Schedule (JSON)" value={form.schedule} onChange={f("schedule")}
                placeholder='[{"month":3,"pct":25},{"month":6,"pct":25},...]' hint="Define unlock percentages at specific months" />
            </div>
          )}
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
            <Btn variant="success" onClick={() => setCreated(true)} disabled={!form.token || !form.beneficiary || !form.amount}>
              🔒 Create Vesting Contract
            </Btn>
          </div>
        </div>
      )}

      {mode === "create" && created && (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h3 style={{ color: C.green, fontFamily: "'Orbitron', monospace" }}>Vesting Created!</h3>
          <p style={{ color: C.textSecondary }}>Contract locked on-chain. Beneficiary will be notified.</p>
          <Btn variant="secondary" onClick={() => { setCreated(false); setMode("active"); }}>View Active Schedules</Btn>
        </div>
      )}

      {mode === "active" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {SAMPLE_VESTS.map((v, i) => (
            <Card key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: C.textPrimary, fontWeight: 700, fontSize: 16 }}>{v.token}</span>
                    <Badge color={v.type === "linear" ? C.accent : C.purple}>{v.type}</Badge>
                  </div>
                  <div style={{ color: C.textSecondary, fontSize: 12, marginTop: 4, fontFamily: "monospace" }}>{v.benef}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: C.textPrimary, fontWeight: 700 }}>{v.claimed} / {v.total}</div>
                  <div style={{ color: C.textDim, fontSize: 11 }}>claimed / total</div>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: C.textSecondary, fontSize: 12 }}>Vested: {v.pct}%</span>
                  <span style={{ color: C.textDim, fontSize: 12 }}>{v.ends}</span>
                </div>
                <ProgressBar value={v.pct} max={100} color={C.purple} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant={v.pct > 0 ? "success" : "secondary"} disabled={v.pct === 0}>
                  {v.pct > 0 ? "🎁 Claim Available" : "⏳ Nothing to Claim"}
                </Btn>
                <Btn size="sm" variant="secondary">View Details</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MODULE: Liquidity Lock ────────────────────────────────────────────────────
function LiquidityLock() {
  const [form, setForm] = useState({ pool: "", amount: "", duration: "180", autoExtend: false });
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  const [locked, setLocked] = useState(false);
  const LOCKS = [
    { pool: "SVLT/BTC", amount: "45,000 LP", duration: "180d", expiry: "Aug 2025", verified: true },
    { pool: "NEON/BTC", amount: "22,000 LP", duration: "365d", expiry: "Mar 2026", verified: true },
    { pool: "BORB/BTC", amount: "8,000 LP", duration: "90d", expiry: "Jun 2025", verified: false },
  ];
  return (
    <div>
      <SectionHeader title="Liquidity Lock" subtitle="Lock MotoSwap LP tokens to build investor confidence" icon="🔐" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3 style={{ color: C.textPrimary, fontSize: 15, marginBottom: 16, fontWeight: 700 }}>Lock LP Tokens</h3>
          <Select label="MotoSwap Pool" value={form.pool} onChange={f("pool")}
            options={[{value:"",label:"Select pool…"},{value:"svlt",label:"SVLT/BTC"},{value:"neon",label:"NEON/BTC"},{value:"borb",label:"BORB/BTC"},{value:"omni",label:"OMNI/BTC"}]} />
          <Input label="LP Token Amount" value={form.amount} onChange={f("amount")} placeholder="e.g. 10000" type="number" />
          <Select label="Lock Duration" value={form.duration} onChange={f("duration")}
            options={[{value:"30",label:"30 Days"},{value:"90",label:"90 Days"},{value:"180",label:"180 Days"},{value:"365",label:"1 Year"},{value:"730",label:"2 Years"},{value:"custom",label:"Custom…"}]} />
          <div onClick={() => setForm(p => ({ ...p, autoExtend: !p.autoExtend }))}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px",
              marginBottom: 16, cursor: "pointer" }}>
            <div>
              <div style={{ color: C.textPrimary, fontSize: 13, fontWeight: 600 }}>🔄 Auto-extend on expiry</div>
              <div style={{ color: C.textDim, fontSize: 11 }}>Automatically re-lock for the same duration</div>
            </div>
            <div style={{ width: 40, height: 22, borderRadius: 11, background: form.autoExtend ? C.accent : C.border, position: "relative", transition: "background .2s" }}>
              <div style={{ position: "absolute", top: 3, left: form.autoExtend ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
            </div>
          </div>
          {!locked ? (
            <Btn variant="primary" size="lg" style={{ width: "100%" }}
              onClick={() => setLocked(true)} disabled={!form.pool || !form.amount}>
              🔐 Lock LP Tokens
            </Btn>
          ) : (
            <div style={{ background: `${C.green}15`, border: `1px solid ${C.green}44`, borderRadius: 10, padding: "14px 18px", textAlign: "center" }}>
              <div style={{ color: C.green, fontWeight: 700 }}>✅ Liquidity Locked!</div>
              <div style={{ color: C.textSecondary, fontSize: 12, marginTop: 4 }}>Unlocks in {form.duration} days · Certificate minted</div>
            </div>
          )}
        </div>
        <div>
          <h3 style={{ color: C.textPrimary, fontSize: 15, marginBottom: 16, fontWeight: 700 }}>Active Locks</h3>
          {LOCKS.map((l, i) => (
            <Card key={i} style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: C.textPrimary, fontWeight: 700 }}>{l.pool}</span>
                {l.verified && <Badge color={C.green}>✓ Verified</Badge>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div><div style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase" }}>Amount</div>
                  <div style={{ color: C.accent, fontSize: 12, fontWeight: 600 }}>{l.amount}</div></div>
                <div><div style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase" }}>Duration</div>
                  <div style={{ color: C.textPrimary, fontSize: 12 }}>{l.duration}</div></div>
                <div><div style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase" }}>Expiry</div>
                  <div style={{ color: C.orange, fontSize: 12 }}>{l.expiry}</div></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MODULE: OTC Escrow ────────────────────────────────────────────────────────
function OTCEscrow() {
  const [tab, setTab] = useState("create");
  const [form, setForm] = useState({ offerToken: "", offerAmt: "", wantToken: "BTC", wantAmt: "", expiry: "24", counterparty: "" });
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  const [created, setCreated] = useState(false);
  const TRADES = [
    { id: "OTC-001", seller: "bc1qaz…1qaz", offerToken: "BORB", offer: "50,000", want: "0.5 BTC", status: "open", expiry: "18h" },
    { id: "OTC-002", seller: "bc1qpn…4tyu", offerToken: "SVLT", offer: "100,000", want: "1.2 BTC", status: "open", expiry: "6h" },
    { id: "OTC-003", seller: "bc1qmx…8iop", offerToken: "NEON", offer: "25,000", want: "0.3 BTC", status: "locked", expiry: "2h" },
  ];
  return (
    <div>
      <SectionHeader title="OTC Escrow" subtitle="Trustless peer-to-peer token trades with on-chain escrow" icon="🤝" />
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[["create","➕ Create Trade"],["browse","🔍 Browse OTC"],["my","📂 My Trades"]].map(([k, l]) => (
          <Btn key={k} variant={tab === k ? "primary" : "secondary"} size="sm" onClick={() => setTab(k)}>{l}</Btn>
        ))}
      </div>

      {tab === "create" && !created && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <h4 style={{ color: C.textSecondary, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>You Offer</h4>
            <Input label="Token" value={form.offerToken} onChange={f("offerToken")} placeholder="e.g. BORB" />
            <Input label="Amount" value={form.offerAmt} onChange={f("offerAmt")} placeholder="50000" type="number" />
          </div>
          <div>
            <h4 style={{ color: C.textSecondary, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>You Want</h4>
            <Select label="Token" value={form.wantToken} onChange={f("wantToken")}
              options={[{value:"BTC",label:"₿ BTC"},{value:"SVLT",label:"SVLT"},{value:"NEON",label:"NEON"},{value:"BORB",label:"BORB"}]} />
            <Input label="Amount" value={form.wantAmt} onChange={f("wantAmt")} placeholder="0.5" type="number" />
          </div>
          <Input label="Expiry (hours)" value={form.expiry} onChange={f("expiry")} placeholder="24" type="number" hint="Trade auto-cancels after this period" />
          <Input label="Counterparty (optional)" value={form.counterparty} onChange={f("counterparty")} placeholder="bc1q… (leave blank for public)" hint="Lock to specific buyer" />
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
            <Btn variant="orange" size="lg" onClick={() => setCreated(true)} disabled={!form.offerToken || !form.offerAmt || !form.wantAmt}>
              🤝 Create Escrow Trade
            </Btn>
          </div>
        </div>
      )}
      {tab === "create" && created && (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
          <h3 style={{ color: C.green, fontFamily: "'Orbitron', monospace" }}>Escrow Created!</h3>
          <p style={{ color: C.textSecondary }}>Your {form.offerAmt} {form.offerToken} is locked in escrow. Share your trade ID.</p>
          <Card style={{ display: "inline-block", padding: "10px 24px", marginBottom: 16 }}>
            <span style={{ color: C.accent, fontFamily: "monospace", fontSize: 18, fontWeight: 700 }}>OTC-{rnd(100,999)}</span>
          </Card>
          <br />
          <Btn variant="secondary" onClick={() => { setCreated(false); setTab("browse"); }}>Browse Open Trades</Btn>
        </div>
      )}

      {tab === "browse" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {TRADES.map(t => (
            <Card key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: C.textDim, fontSize: 12, fontFamily: "monospace" }}>{t.id}</span>
                  <Badge color={t.status === "open" ? C.green : C.orange}>{t.status}</Badge>
                </div>
                <div style={{ color: C.textPrimary, fontWeight: 700, fontSize: 15 }}>
                  {t.offer} <span style={{ color: C.accent }}>{t.offerToken}</span>
                  <span style={{ color: C.textDim, margin: "0 8px" }}>→</span>
                  {t.want} <span style={{ color: C.orange }}>BTC</span>
                </div>
                <div style={{ color: C.textSecondary, fontSize: 12, marginTop: 2, fontFamily: "monospace" }}>{t.seller}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: C.textDim, fontSize: 12, marginBottom: 8 }}>⏱ Expires: {t.expiry}</div>
                <Btn size="sm" variant={t.status === "open" ? "success" : "secondary"} disabled={t.status !== "open"}>
                  {t.status === "open" ? "Accept Trade" : "Locked"}
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "my" && (
        <div style={{ textAlign: "center", padding: "40px 0", color: C.textDim }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <p>Connect your wallet to view your OTC trades.</p>
          <Btn variant="secondary">Connect Wallet</Btn>
        </div>
      )}
    </div>
  );
}

// ── MODULE: Staking Vault ─────────────────────────────────────────────────────
function StakingVault() {
  const [stakeAmt, setStakeAmt] = useState("");
  const [staked, setStaked] = useState(false);
  const VAULTS = [
    { token: "SVLT", apy: "48.2%", tvl: "$2.4M", multiplier: "1.25x", compound: "hourly" },
    { token: "NEON", apy: "92.1%", tvl: "$890K", multiplier: "1.5x", compound: "hourly" },
    { token: "BORB", apy: "31.4%", tvl: "$5.1M", multiplier: "1.1x", compound: "daily" },
  ];
  const [selectedVault, setSelectedVault] = useState("SVLT");
  const v = VAULTS.find(x => x.token === selectedVault);

  return (
    <div>
      <SectionHeader title="Auto-Compound Staking" subtitle="Stake project tokens and earn auto-compounded rewards" icon="⚡" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
        {VAULTS.map(v2 => (
          <Card key={v2.token} onClick={() => setSelectedVault(v2.token)}
            glow={selectedVault === v2.token}
            style={{ cursor: "pointer", border: `1px solid ${selectedVault === v2.token ? C.accent : C.border}`,
              transition: "all .2s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ color: C.textPrimary, fontWeight: 700, fontSize: 16 }}>{v2.token}</span>
              <Badge color={C.green}>{v2.apy} APY</Badge>
            </div>
            <div style={{ color: C.textSecondary, fontSize: 12 }}>TVL: <span style={{ color: C.textPrimary }}>{v2.tvl}</span></div>
            <div style={{ color: C.textSecondary, fontSize: 12 }}>Boost: <span style={{ color: C.purple }}>{v2.multiplier}</span></div>
            <div style={{ color: C.textSecondary, fontSize: 12 }}>Compounds: <span style={{ color: C.orange }}>{v2.compound}</span></div>
          </Card>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ margin: "0 0 16px", color: C.textPrimary, fontSize: 15 }}>Stake {selectedVault}</h3>
          <Input label="Amount to Stake" value={stakeAmt} onChange={setStakeAmt} placeholder="0" type="number" />
          {stakeAmt && (
            <div style={{ background: C.bg, borderRadius: 8, padding: 12, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: C.textSecondary, fontSize: 12 }}>APY</span>
                <span style={{ color: C.green, fontWeight: 700 }}>{v.apy}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: C.textSecondary, fontSize: 12 }}>Daily Yield</span>
                <span style={{ color: C.textPrimary, fontSize: 12 }}>{(parseFloat(stakeAmt) * 0.00132).toFixed(2)} {selectedVault}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.textSecondary, fontSize: 12 }}>30d Projection</span>
                <span style={{ color: C.accent, fontSize: 12 }}>{(parseFloat(stakeAmt) * 0.0396).toFixed(0)} {selectedVault}</span>
              </div>
            </div>
          )}
          {!staked ? (
            <Btn variant="success" size="lg" style={{ width: "100%" }}
              onClick={() => setStaked(true)} disabled={!stakeAmt}>
              ⚡ Stake {selectedVault}
            </Btn>
          ) : (
            <div>
              <div style={{ background: `${C.green}15`, border: `1px solid ${C.green}44`, borderRadius: 10, padding: "12px 16px", marginBottom: 12, textAlign: "center" }}>
                <div style={{ color: C.green, fontWeight: 700 }}>✅ Staked {stakeAmt} {selectedVault}</div>
              </div>
              <Btn variant="danger" size="sm" onClick={() => setStaked(false)}>Unstake</Btn>
            </div>
          )}
        </Card>
        <Card>
          <h3 style={{ margin: "0 0 16px", color: C.textPrimary, fontSize: 15 }}>Vault Stats</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[["Total Stakers","1,842"],["Reward Pool","4.2M "+selectedVault],
              ["Next Compound","14m 32s"],["Your Share","0%"]].map(([l,v2]) => (
              <div key={l} style={{ background: C.bg, borderRadius: 8, padding: 12 }}>
                <div style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase" }}>{l}</div>
                <div style={{ color: C.accent, fontWeight: 700, marginTop: 4, fontFamily: "monospace" }}>{v2}</div>
              </div>
            ))}
          </div>
          <Divider />
          <div style={{ display: "flex", gap: 8 }}>
            <Badge color={C.green}>✓ Audited</Badge>
            <Badge color={C.accent}>Auto-compound</Badge>
            <Badge color={C.purple}>Boosted</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── MODULE: TX Log ────────────────────────────────────────────────────────────
function TXLog() {
  const [filter, setFilter] = useState("all");
  const types = ["all", "Deploy", "Presale Buy", "Lock LP", "Stake", "OTC Escrow", "Vest Claim"];
  const shown = filter === "all" ? MOCK_TXS : MOCK_TXS.filter(t => t.type === filter);
  const typeColor = { "Deploy": C.accent, "Presale Buy": C.orange, "Lock LP": C.purple,
    "Stake": C.green, "OTC Escrow": "#ffd700", "Vest Claim": "#ff69b4" };
  return (
    <div>
      <SectionHeader title="TX Log" subtitle="Transparent on-chain activity with OP_SCAN explorer links" icon="🔍" />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {types.map(t => (
          <Btn key={t} variant={filter === t ? "primary" : "secondary"} size="sm" onClick={() => setFilter(t)}>{t}</Btn>
        ))}
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {["TX Hash","Type","Token","Amount","Time","Status","Explorer"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: C.textSecondary,
                    fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em",
                    borderBottom: `1px solid ${C.border}`, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((tx, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`,
                  background: i % 2 === 0 ? "transparent" : `${C.surfaceHi}40` }}>
                  <td style={{ padding: "12px 16px", color: C.accent, fontFamily: "monospace", fontSize: 12 }}>{tx.hash}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge color={typeColor[tx.type] || C.accent}>{tx.type}</Badge>
                  </td>
                  <td style={{ padding: "12px 16px", color: C.textPrimary, fontWeight: 600 }}>{tx.token}</td>
                  <td style={{ padding: "12px 16px", color: C.textSecondary, fontFamily: "monospace" }}>{tx.amount}</td>
                  <td style={{ padding: "12px 16px", color: C.textDim }}>{tx.time}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <PulsingDot color={tx.status === "confirmed" ? C.green : C.orange} />
                      <span style={{ color: tx.status === "confirmed" ? C.green : C.orange, fontSize: 12 }}>{tx.status}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <a href="#" style={{ color: C.accent, fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                      OP_SCAN ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
const MODULES = [
  { id: "deploy", label: "Token Deploy", icon: "🚀", component: TokenWizard },
  { id: "presale", label: "Presale", icon: "📊", component: PresaleDashboard },
  { id: "vesting", label: "Vesting", icon: "📅", component: VestingDashboard },
  { id: "liquidity", label: "Liquidity Lock", icon: "🔐", component: LiquidityLock },
  { id: "staking", label: "Staking", icon: "⚡", component: StakingVault },
  { id: "otc", label: "OTC Escrow", icon: "🤝", component: OTCEscrow },
  { id: "txlog", label: "TX Log", icon: "🔍", component: TXLog },
];

export default function App() {
  const [activeModule, setActiveModule] = useState("deploy");
  const [tick, setTick] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // live ticker simulation
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const stats = [
    { label: "Total Raised", value: "$" + fmt(1240000 + tick * 120) },
    { label: "Tokens Launched", value: fmt(47 + Math.floor(tick / 3)) },
    { label: "Active Stakers", value: fmt(3821 + tick * 2) },
    { label: "LP Locked", value: "$" + fmt(8900000 + tick * 450) },
  ];

  const ActiveComponent = MODULES.find(m => m.id === activeModule)?.component || TokenWizard;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;800;900&family=JetBrains+Mono:wght@400;600&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; color: ${C.textPrimary}; font-family: 'Syne', sans-serif; min-height: 100vh; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        select option { background: ${C.surfaceHi}; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes glow { 0%,100%{text-shadow:0 0 8px ${C.accent}80} 50%{text-shadow:0 0 20px ${C.accent},0 0 40px ${C.accent}60} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .module-content { animation: fadeIn .3s ease; }
        .nav-item:hover { background: ${C.surfaceHi} !important; }
      `}</style>

      {/* Ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "50%",
          background: `radial-gradient(ellipse, ${C.accent}08 0%, transparent 60%)` }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "50%", height: "50%",
          background: `radial-gradient(ellipse, ${C.purple}08 0%, transparent 60%)` }} />
      </div>

      {/* Top bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: `${C.bg}ee`, backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 20px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: "none", background: "none", border: "none",
              color: C.textPrimary, cursor: "pointer", fontSize: 20, padding: 4,
              '@media(max-width:768px)': { display: "block" } }}>☰</button>
            <div style={{ width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
            <div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: 16,
                background: `linear-gradient(90deg, ${C.accent}, ${C.purple})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                animation: "glow 3s infinite" }}>OP_LAUNCH</div>
              <div style={{ color: C.textDim, fontSize: 10, letterSpacing: "0.12em", marginTop: -2 }}>DEFI LAUNCHPAD</div>
            </div>
          </div>

          {/* Live stats ticker */}
          <div style={{ display: "flex", gap: 24, flex: 1, justifyContent: "center",
            overflow: "hidden" }}>
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: "center", display: "flex", flexDirection: "column" }}>
                <span style={{ color: C.accent, fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13, fontWeight: 700, letterSpacing: "0.04em" }}>{s.value}</span>
                <span style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Wallet */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <PulsingDot color={C.green} />
              <span style={{ color: C.textSecondary, fontSize: 12 }}>OP_NET</span>
            </div>
            <Btn variant="secondary" size="sm">🔗 Connect Wallet</Btn>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: "flex", paddingTop: 60, minHeight: "100vh", position: "relative", zIndex: 1 }}>

        {/* Sidebar */}
        <nav style={{ width: 220, flexShrink: 0, position: "fixed", top: 60, bottom: 0,
          left: 0, background: C.surface, borderRight: `1px solid ${C.border}`,
          padding: "20px 12px", overflowY: "auto", zIndex: 50 }}>

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase",
              letterSpacing: "0.12em", marginBottom: 8, paddingLeft: 8 }}>Modules</div>
            {MODULES.map((m, idx) => {
              const isActive = activeModule === m.id;
              return (
                <div key={m.id}>
                  {idx === 4 && <div style={{ height: 1, background: C.border, margin: "8px 0" }} />}
                  <button className="nav-item" onClick={() => setActiveModule(m.id)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                      background: isActive ? `${C.accent}18` : "transparent",
                      color: isActive ? C.accent : C.textSecondary,
                      fontSize: 13, fontWeight: isActive ? 700 : 400,
                      textAlign: "left", transition: "all .15s", fontFamily: "inherit",
                      borderLeft: isActive ? `2px solid ${C.accent}` : "2px solid transparent",
                    }}>
                    <span style={{ fontSize: 16 }}>{m.icon}</span>
                    <span>{m.label}</span>
                    {m.id === "presale" && <span style={{ marginLeft: "auto" }}>
                      <Badge color={C.green}>LIVE</Badge></span>}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 8 }}>
            <div style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase",
              letterSpacing: "0.12em", marginBottom: 8, paddingLeft: 8 }}>Links</div>
            {[["📖 Docs","#"],["💬 Discord","#"],["🐦 Twitter","#"],["🔍 OP_SCAN","#"]].map(([l, h]) => (
              <a key={l} href={h} style={{ display: "block", padding: "8px 12px", color: C.textDim,
                fontSize: 12, textDecoration: "none", borderRadius: 6, transition: "color .15s" }}
                onMouseEnter={e => e.target.style.color = C.textPrimary}
                onMouseLeave={e => e.target.style.color = C.textDim}>{l}</a>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, marginLeft: 220, padding: "32px 32px 80px", maxWidth: "calc(100% - 220px)" }}>
          <div className="module-content" key={activeModule}>
            <ActiveComponent />
          </div>
        </main>
      </div>

      {/* Bottom pipeline nav */}
      <div style={{ position: "fixed", bottom: 0, left: 220, right: 0, zIndex: 90,
        background: `${C.bg}f8`, backdropFilter: "blur(12px)",
        borderTop: `1px solid ${C.border}`, padding: "10px 20px" }}>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
          {MODULES.map((m, i) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setActiveModule(m.id)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                  borderRadius: 20, border: `1px solid ${activeModule === m.id ? C.accent : C.border}`,
                  background: activeModule === m.id ? `${C.accent}18` : "transparent",
                  color: activeModule === m.id ? C.accent : C.textSecondary,
                  cursor: "pointer", fontSize: 12, fontWeight: activeModule === m.id ? 700 : 400,
                  fontFamily: "inherit", transition: "all .15s" }}>
                <span>{m.icon}</span>
                <span style={{ display: window.innerWidth < 600 ? "none" : "inline" }}>{m.label}</span>
              </button>
              {i < MODULES.length - 1 && <span style={{ color: C.border, fontSize: 10 }}>→</span>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
