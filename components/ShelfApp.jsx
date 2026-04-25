'use client'
import { useState, useEffect, useRef } from "react";
import { supabase } from '@/lib/supabase'

const T = {
  bg: "#f7f4ef", card: "#ffffff", card2: "#f0ede8", border: "#e0dbd2",
  navBg: "#ffffff", primary: "#2d6a4f", accent: "#52b788", warn: "#e07a3a",
  red: "#d62828", green: "#2d6a4f", text: "#1a1a1a", muted: "#7a7570", dim: "#b5b0aa",
  gradA: "#2d6a4f", gradB: "#52b788",
};

const CATEGORIES = [
  { id: "fruit_veg",     label: "Fruit & Veg",    icon: "🥦", items: ["Tomato","Avo","Carrot","Lemon","Lime","Ginger","Mushroom","Banana","Oranges","Cucumber","Red Onions","Brown Onions","Sweet Potato","Leeks","Garlic","Kimchi"] },
  { id: "flours_sugars", label: "Flours & Sugars", icon: "🌾", items: ["Plain Flour","Self Raising","Caster Sugar","Light Brown Sugar","Bread Flour","GF Self Raising","Icing Sugar","Cocoa Powder","Demerara Sugar"] },
  { id: "chocolate",     label: "Chocolate",       icon: "🍫", items: ["Dark Choc","Milk Choc","White Choc","Cocoa Powder","Crispearls"] },
  { id: "sauces",        label: "Sauces",          icon: "🧴", items: ["Ketchup","Mayo","Brown","BBQ","Mojo","Mustard","Chilli Jam"] },
  { id: "shelf",         label: "Shelf",           icon: "🥫", items: ["Peanut Butter","Coconut Milk","Stock","Chipotle","Gochujang","Black Beans","Butter Beans","Cannellini Beans","Gherkins","Tuna","Chopped Tomatoes","Tinned Peppers","Maple Syrup"] },
  { id: "vinegars_oils", label: "Vinegars & Oils", icon: "🫙", items: ["Red Wine Vinegar","White Wine Vinegar","Balsamic Vinegar","Olive Oil","Rapeseed Oil","Coconut Oil"] },
  { id: "spices",        label: "Spices",          icon: "🌶️", items: ["Paprika","Table Salt","Maldon Salt","Pepper","Cumin","Coriander Seeds","Mixed Spice","Ground Ginger","Cinnamon","Oregano","Sesame Seeds","Baking Powder","Bicarb"] },
  { id: "baking",        label: "Baking",          icon: "🧁", items: ["Oats","Pecans","Almonds","Pumpkin Seeds","Coconut","Vanilla","Orange Oil"] },
  { id: "herbs",         label: "Herbs",           icon: "🌿", items: ["Dill","Coriander","Parsley","Thyme","Mint","Peashoots"] },
  { id: "dairy",         label: "Dairy",           icon: "🥛", items: ["Full Fat Milk","Skinny Milk","Oat Milk","Coconut Milk","Cheddar","Emmental","Buttermilk","Halloumi","Feta","Butter","Yoghurt","Cream Cheese","Creme Fraiche","Double Cream"] },
  { id: "frozen",        label: "Frozen",          icon: "❄️", items: ["Mixed Berries","Blueberries","Mango","Peas","Chocolate Ice Cream","Strawberry Ice Cream","Vanilla Ice Cream"] },
  { id: "meat",          label: "Meat",            icon: "🥩", items: ["Ham","Chorizo","Chicken","Bacon","Pork","Beef","Sausages","BP"] },
  { id: "other",         label: "Other",           icon: "📦", items: ["Hummus"] },
];

const ALL_ITEMS = CATEGORIES.flatMap(c => c.items.map(name => ({
  id: `${c.id}__${name.toLowerCase().replace(/\s+/g,'_')}`,
  name, category: c.id,
  catLabel: CATEGORIES.find(x => x.id === c.id)?.label,
  catIcon: CATEGORIES.find(x => x.id === c.id)?.icon,
})));

const stockStatus = (qty, threshold) => {
  if (qty === null || qty === undefined) return "unknown";
  if (qty === 0) return "out";
  if (qty <= (threshold ?? 2)) return "low";
  return "ok";
};
const statusColor = (s) => s === "out" ? T.red : s === "low" ? T.warn : T.green;
const statusLabel = (s) => s === "out" ? "Out" : s === "low" ? "Low" : s === "ok" ? "OK" : "—";

function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: "stock",    label: "Stock",  icon: "📦" },
    { id: "count",    label: "Count",  icon: "✅" },
    { id: "order",    label: "Order",  icon: "📋" },
    { id: "settings", label: "Setup",  icon: "⚙️" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: T.navBg, borderTop: `1px solid ${T.border}`, display: "flex", zIndex: 100, boxShadow: "0 -2px 12px rgba(0,0,0,0.06)" }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", padding: "10px 2px 13px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
            {active && <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 3, background: T.primary, borderRadius: "0 0 6px 6px" }} />}
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: 0.5, color: active ? T.primary : T.muted, fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", fontWeight: active ? 700 : 400 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TopBar() {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", zIndex: 99, background: T.navBg, borderBottom: `1px solid ${T.border}`, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>🌿</span>
        <span style={{ fontSize: 16, fontFamily: "'Lora',serif", fontWeight: 700, color: T.text }}>Shelf</span>
      </div>
      <span style={{ fontSize: 13, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>Hips Social</span>
    </div>
  );
}

function StockRow({ item, qty, threshold, target, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const status = stockStatus(qty, threshold ?? 2);
  const col = statusColor(status);
  const commit = () => { const n = parseInt(draft); if (!isNaN(n) && n >= 0) onUpdate(n); setEditing(false); };
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "13px 16px", borderBottom: `1px solid ${T.border}`, background: status === "out" ? "#fff5f5" : status === "low" ? "#fff9f4" : T.card }}>
      <div style={{ width: 10, height: 10, borderRadius: 5, background: col, marginRight: 12, flexShrink: 0, boxShadow: `0 0 6px ${col}88` }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, color: T.text, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{item.name}</div>
        {target > 0 && <div style={{ fontSize: 11, color: T.muted, fontFamily: "'DM Sans',sans-serif", marginTop: 1 }}>target: {target}</div>}
      </div>
      {editing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            type="number" min="0"
            style={{ width: 64, background: T.card2, border: `2px solid ${T.primary}`, borderRadius: 10, color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 700, padding: "6px 10px", textAlign: "center", outline: "none" }} />
          <button onClick={commit} style={{ background: T.primary, border: "none", borderRadius: 10, color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "8px 14px", cursor: "pointer" }}>✓</button>
        </div>
      ) : (
        <button onClick={() => { setDraft(String(qty ?? "")); setEditing(true); }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", background: status === "out" ? `${T.red}15` : status === "low" ? `${T.warn}15` : `${T.green}12`, border: `1.5px solid ${col}`, borderRadius: 12, padding: "6px 14px", cursor: "pointer", minWidth: 58 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: col, fontFamily: "'DM Sans',sans-serif", lineHeight: 1 }}>{qty !== null && qty !== undefined ? qty : "—"}</span>
          <span style={{ fontSize: 9, color: col, fontFamily: "'DM Sans',sans-serif", letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>{statusLabel(status)}</span>
        </button>
      )}
    </div>
  );
}

function StockTab({ stock, thresholds, targets, onUpdate }) {
  const [search, setSearch] = useState("");
  const [openCat, setOpenCat] = useState(null);
  const lowCount = ALL_ITEMS.filter(i => { const s = stockStatus(stock[i.id], thresholds[i.id] ?? 2); return s === "low" || s === "out"; }).length;
  const filtered = search.trim() ? CATEGORIES.map(c => ({ ...c, items: c.items.filter(i => i.toLowerCase().includes(search.toLowerCase())) })).filter(c => c.items.length > 0) : CATEGORIES;
  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: "56px 16px 16px", background: T.card, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Sans',sans-serif" }}>Hips Social</div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontSize: 32, fontFamily: "'Lora',serif", fontWeight: 700, color: T.text }}>Stock</div>
          {lowCount > 0 && <div style={{ background: `${T.warn}20`, border: `1px solid ${T.warn}`, borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 13 }}>⚠️</span><span style={{ fontSize: 12, color: T.warn, fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>{lowCount} items low</span></div>}
        </div>
        <div style={{ marginTop: 12, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: T.dim }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
            style={{ width: "100%", boxSizing: "border-box", background: T.card2, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: 15, padding: "11px 14px 11px 38px", outline: "none" }} />
        </div>
      </div>
      {filtered.map(cat => {
        const catLow = cat.items.filter(name => { const item = ALL_ITEMS.find(i => i.name === name && i.category === cat.id); const s = stockStatus(stock[item?.id], thresholds[item?.id] ?? 2); return s === "low" || s === "out"; }).length;
        const isOpen = openCat === cat.id || !!search.trim();
        return (
          <div key={cat.id}>
            {!search.trim() && (
              <button onClick={() => setOpenCat(isOpen ? null : cat.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: T.bg, border: "none", borderBottom: `1px solid ${T.border}`, cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 22 }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: "'DM Sans',sans-serif" }}>{cat.label}</div>
                  <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>{cat.items.length} items</div>
                </div>
                {catLow > 0 && <div style={{ background: T.warn, borderRadius: 10, padding: "2px 8px" }}><span style={{ fontSize: 11, color: "#fff", fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>{catLow} low</span></div>}
                <span style={{ color: T.dim, fontSize: 14 }}>{isOpen ? "▲" : "▼"}</span>
              </button>
            )}
            {isOpen && (
              <div style={{ background: T.card }}>
                {cat.items.map(name => {
                  const item = ALL_ITEMS.find(i => i.name === name && i.category === cat.id);
                  if (!item) return null;
                  return <StockRow key={item.id} item={item} qty={stock[item.id] ?? null} threshold={thresholds[item.id] ?? 2} target={targets[item.id] ?? 0} onUpdate={v => onUpdate(item.id, v)} />;
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CountTab({ stock, thresholds, targets, countOrder, onUpdate, onFinish }) {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);
  const orderedItems = countOrder.length > 0 ? countOrder.map(id => ALL_ITEMS.find(i => i.id === id)).filter(Boolean) : ALL_ITEMS;
  const total = orderedItems.length;
  const pct = total > 0 ? Math.round((idx / total) * 100) : 0;
  const current = orderedItems[idx];
  useEffect(() => { if (started && inputRef.current) inputRef.current.focus(); }, [idx, started]);

  const next = () => {
    const n = parseInt(draft);
    if (!isNaN(n) && n >= 0) onUpdate(current.id, n);
    if (idx < total - 1) { setIdx(idx + 1); setDraft(String(stock[orderedItems[idx + 1]?.id] ?? "")); }
    else { setStarted(false); setIdx(0); setDraft(""); onFinish(); }
  };
  const skip = () => {
    if (idx < total - 1) { setIdx(idx + 1); setDraft(String(stock[orderedItems[idx + 1]?.id] ?? "")); }
    else { setStarted(false); setIdx(0); onFinish(); }
  };

  if (!started) {
    return (
      <div style={{ paddingBottom: 90 }}>
        <div style={{ padding: "56px 16px 16px", background: T.card, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Sans',sans-serif" }}>Daily</div>
          <div style={{ fontSize: 32, fontFamily: "'Lora',serif", fontWeight: 700, color: T.text }}>Stock Count</div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ background: T.card, borderRadius: 20, padding: 24, border: `1px solid ${T.border}`, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 20, fontFamily: "'Lora',serif", fontWeight: 700, color: T.text, marginBottom: 8 }}>Ready to count?</div>
            <div style={{ fontSize: 14, color: T.muted, fontFamily: "'DM Sans',sans-serif", marginBottom: 20, lineHeight: 1.6 }}>Goes through all {total} items one by one. Enter the quantity and hit Next. Order list generates automatically when done.</div>
            <button onClick={() => { setIdx(0); setDraft(String(stock[orderedItems[0]?.id] ?? "")); setStarted(true); }}
              style={{ width: "100%", background: T.primary, border: "none", borderRadius: 14, color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 700, padding: "16px", cursor: "pointer" }}>
              Start Count
            </button>
          </div>
          <div style={{ background: T.card, borderRadius: 16, padding: 16, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Count order</div>
            <div style={{ fontSize: 13, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>{orderedItems.slice(0, 5).map(i => i.name).join(", ")}{orderedItems.length > 5 ? ` + ${orderedItems.length - 5} more...` : ""}</div>
            <div style={{ fontSize: 12, color: T.dim, fontFamily: "'DM Sans',sans-serif", marginTop: 6 }}>Change order in Setup tab</div>
          </div>
        </div>
      </div>
    );
  }

  const target = targets[current.id] ?? 0;
  return (
    <div style={{ paddingBottom: 90, minHeight: "100vh", background: T.bg }}>
      <div style={{ position: "fixed", top: 50, left: 0, right: 0, maxWidth: 480, margin: "0 auto", zIndex: 98, background: T.card, borderBottom: `1px solid ${T.border}`, padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>{idx + 1} of {total}</span>
          <span style={{ fontSize: 12, color: T.primary, fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>{pct}% done</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: T.card2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: T.primary, borderRadius: 3, transition: "width .3s" }} />
        </div>
      </div>
      <div style={{ padding: "130px 20px 20px" }}>
        <div style={{ background: T.card, borderRadius: 24, padding: 28, border: `1px solid ${T.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>{current.catIcon}</span>
            <span style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>{current.catLabel}</span>
          </div>
          <div style={{ fontSize: 32, fontFamily: "'Lora',serif", fontWeight: 700, color: T.text, marginBottom: 8 }}>{current.name}</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
            {target > 0 && <div style={{ background: `${T.primary}12`, borderRadius: 10, padding: "6px 12px" }}><span style={{ fontSize: 12, color: T.primary, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>target: {target}</span></div>}
            <div style={{ background: T.card2, borderRadius: 10, padding: "6px 12px" }}><span style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>last: {stock[current.id] !== undefined ? stock[current.id] : "—"}</span></div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans',sans-serif", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>How many do you have?</div>
            <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") next(); }}
              type="number" min="0" placeholder="0"
              style={{ width: "100%", boxSizing: "border-box", background: T.card2, border: `2px solid ${T.primary}`, borderRadius: 16, color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: 42, fontWeight: 700, padding: "16px 20px", textAlign: "center", outline: "none" }} />
          </div>
          <button onClick={next} style={{ width: "100%", background: T.primary, border: "none", borderRadius: 14, color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 700, padding: "16px", cursor: "pointer", marginBottom: 10 }}>
            {idx === total - 1 ? "Finish Count ✓" : "Next →"}
          </button>
          <button onClick={skip} style={{ width: "100%", background: "none", border: `1px solid ${T.border}`, borderRadius: 14, color: T.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 15, padding: "12px", cursor: "pointer" }}>Skip</button>
        </div>
        {idx < total - 1 && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: T.card, borderRadius: 14, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, color: T.dim, fontFamily: "'DM Sans',sans-serif", marginBottom: 4 }}>NEXT UP</div>
            <div style={{ fontSize: 14, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>{orderedItems[idx + 1]?.name}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderTab({ stock, thresholds, targets }) {
  const [copied, setCopied] = useState(false);
  const toOrder = ALL_ITEMS.map(item => {
    const qty = stock[item.id] ?? null;
    const target = targets[item.id] ?? 0;
    const needed = target > 0 && (qty === null || qty < target) ? (target - (qty ?? 0)) : 0;
    const status = stockStatus(qty, thresholds[item.id] ?? 2);
    if (target > 0 && needed > 0) return { ...item, qty, target, needed, status };
    if (target === 0 && (status === "low" || status === "out")) return { ...item, qty, target: 0, needed: 0, status };
    return null;
  }).filter(Boolean);

  const orderText = toOrder.length === 0 ? "All stock levels are good." :
    `ORDER LIST — ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}\n\n` +
    CATEGORIES.map(cat => {
      const catItems = toOrder.filter(i => i.category === cat.id);
      if (!catItems.length) return null;
      return `${cat.label}:\n` + catItems.map(i => i.target > 0 ? `  - ${i.name}: order ${i.needed} (have ${i.qty ?? 0}, target ${i.target})` : `  - ${i.name} (${i.status === "out" ? "OUT" : `low — qty ${i.qty}`})`).join("\n");
    }).filter(Boolean).join("\n\n");

  const copy = () => { navigator.clipboard.writeText(orderText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: "56px 16px 16px", background: T.card, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Sans',sans-serif" }}>Auto Generated</div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontSize: 32, fontFamily: "'Lora',serif", fontWeight: 700, color: T.text }}>Order List</div>
          {toOrder.length > 0 && <button onClick={copy} style={{ background: copied ? T.green : T.primary, border: "none", borderRadius: 12, color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, padding: "8px 16px", cursor: "pointer" }}>{copied ? "✓ Copied!" : "Copy List"}</button>}
        </div>
      </div>
      {toOrder.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 18, color: T.text, fontFamily: "'Lora',serif", fontWeight: 700, marginBottom: 6 }}>Nothing to order</div>
          <div style={{ fontSize: 14, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>All stock levels are good</div>
        </div>
      ) : (
        <div>
          <div style={{ padding: "12px 16px", background: `${T.primary}10`, borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 13, color: T.primary, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · {toOrder.length} items to order</span>
          </div>
          {CATEGORIES.map(cat => {
            const catItems = toOrder.filter(i => i.category === cat.id);
            if (!catItems.length) return null;
            return (
              <div key={cat.id}>
                <div style={{ padding: "10px 16px 6px", background: T.bg, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{cat.icon}</span>
                  <span style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{cat.label}</span>
                </div>
                {catItems.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "13px 16px", borderBottom: `1px solid ${T.border}`, background: T.card }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: statusColor(item.status), marginRight: 12, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, color: T.text, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{item.name}</div>
                      {item.target > 0 && <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>have {item.qty ?? 0} · target {item.target}</div>}
                    </div>
                    {item.target > 0 ? (
                      <div style={{ background: `${T.primary}15`, border: `1px solid ${T.primary}`, borderRadius: 10, padding: "4px 12px", textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: T.primary, fontFamily: "'DM Sans',sans-serif", lineHeight: 1 }}>+{item.needed}</div>
                        <div style={{ fontSize: 9, color: T.primary, fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase" }}>order</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: item.status === "out" ? T.red : T.warn, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", background: item.status === "out" ? `${T.red}15` : `${T.warn}15`, borderRadius: 8, padding: "3px 10px" }}>{item.status === "out" ? "OUT" : `qty: ${item.qty}`}</span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ user, onSignOut, thresholds, onThresholdChange, targets, onTargetChange, countOrder, onCountOrderChange }) {
  const [section, setSection] = useState("targets");
  const [search, setSearch] = useState("");
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const orderedItems = countOrder.length > 0 ? countOrder.map(id => ALL_ITEMS.find(i => i.id === id)).filter(Boolean) : ALL_ITEMS;
  const filtered = search.trim() ? ALL_ITEMS.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : ALL_ITEMS;

  const moveItem = (fromIdx, toIdx) => {
    const newOrder = [...orderedItems];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    onCountOrderChange(newOrder.map(i => i.id));
  };

  const sections = [
    { id: "targets",    label: "Targets",     icon: "🎯" },
    { id: "order",      label: "Count Order", icon: "🔢" },
    { id: "thresholds", label: "Warnings",    icon: "⚠️" },
    { id: "account",    label: "Account",     icon: "👤" },
  ];

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: "56px 16px 16px", background: T.card, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Sans',sans-serif" }}>Hips Social</div>
        <div style={{ fontSize: 32, fontFamily: "'Lora',serif", fontWeight: 700, color: T.text, marginBottom: 14 }}>Setup</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{ flexShrink: 0, background: section === s.id ? T.primary : T.card2, border: `1px solid ${section === s.id ? T.primary : T.border}`, borderRadius: 20, color: section === s.id ? "#fff" : T.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: section === s.id ? 700 : 400, padding: "7px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <span>{s.icon}</span>{s.label}
            </button>
          ))}
        </div>
      </div>

      {section === "targets" && (
        <div>
          <div style={{ padding: "14px 16px 8px", background: T.bg }}>
            <div style={{ fontSize: 13, color: T.muted, fontFamily: "'DM Sans',sans-serif", marginBottom: 10, lineHeight: 1.6 }}>Set target quantity for each item. The order list calculates exactly how much to order to reach target.</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." style={{ width: "100%", boxSizing: "border-box", background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: 15, padding: "10px 14px", outline: "none" }} />
          </div>
          <div style={{ background: T.card }}>
            {filtered.map(item => {
              const current = targets[item.id] ?? 0;
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${T.border}`, gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: T.text, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>{item.catLabel}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => onTargetChange(item.id, Math.max(0, current - 1))} style={{ width: 36, height: 36, borderRadius: 10, background: T.card2, border: `1px solid ${T.border}`, color: T.text, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <div style={{ width: 44, textAlign: "center", fontSize: 20, fontWeight: 700, color: current > 0 ? T.primary : T.dim, fontFamily: "'DM Sans',sans-serif" }}>{current}</div>
                    <button onClick={() => onTargetChange(item.id, current + 1)} style={{ width: 36, height: 36, borderRadius: 10, background: T.primary, border: "none", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {section === "order" && (
        <div>
          <div style={{ padding: "14px 16px 8px", background: T.bg }}>
            <div style={{ fontSize: 13, color: T.muted, fontFamily: "'DM Sans',sans-serif", marginBottom: 4, lineHeight: 1.6 }}>Drag items to reorder them to match how you walk around the kitchen during your count.</div>
          </div>
          <div style={{ background: T.card }}>
            {orderedItems.map((item, i) => (
              <div key={item.id} draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={e => { e.preventDefault(); setDragOverIdx(i); }}
                onDrop={() => { if (dragIdx !== null && dragIdx !== i) moveItem(dragIdx, i); setDragIdx(null); setDragOverIdx(null); }}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                style={{ display: "flex", alignItems: "center", padding: "13px 16px", borderBottom: `1px solid ${T.border}`, background: dragOverIdx === i ? `${T.primary}10` : T.card, gap: 12, cursor: "grab" }}>
                <span style={{ fontSize: 14, color: T.dim, fontFamily: "'DM Sans',sans-serif", width: 24, textAlign: "center" }}>{i + 1}</span>
                <span style={{ fontSize: 16 }}>{item.catIcon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: T.text, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>{item.catLabel}</div>
                </div>
                <span style={{ fontSize: 18, color: T.dim }}>⠿</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === "thresholds" && (
        <div>
          <div style={{ padding: "14px 16px 8px", background: T.bg }}>
            <div style={{ fontSize: 13, color: T.muted, fontFamily: "'DM Sans',sans-serif", marginBottom: 10, lineHeight: 1.6 }}>At what quantity does an item turn orange? Default is 2.</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." style={{ width: "100%", boxSizing: "border-box", background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: 15, padding: "10px 14px", outline: "none" }} />
          </div>
          <div style={{ background: T.card }}>
            {filtered.map(item => {
              const current = thresholds[item.id] ?? 2;
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${T.border}`, gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: T.text, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>{item.catLabel}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1,2,3,5,10].map(n => (
                      <button key={n} onClick={() => onThresholdChange(item.id, n)} style={{ width: 36, height: 36, borderRadius: 10, background: current === n ? T.warn : T.card2, border: `1px solid ${current === n ? T.warn : T.border}`, color: current === n ? "#fff" : T.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: current === n ? 700 : 400, cursor: "pointer" }}>{n}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {section === "account" && (
        <div style={{ padding: 20 }}>
          <div style={{ background: T.card, borderRadius: 16, padding: 20, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans',sans-serif", marginBottom: 4 }}>Signed in as</div>
            <div style={{ fontSize: 15, color: T.text, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, marginBottom: 16 }}>{user?.email}</div>
            <button onClick={onSignOut} style={{ width: "100%", background: "transparent", border: `1px solid ${T.red}`, borderRadius: 12, color: T.red, fontFamily: "'DM Sans',sans-serif", fontSize: 15, padding: "12px", cursor: "pointer" }}>Sign Out</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShelfApp({ user, onSignOut }) {
  const [tab, setTab] = useState("stock");
  const [stock, setStock] = useState({});
  const [thresholds, setThresholds] = useState({});
  const [targets, setTargets] = useState({});
  const [countOrder, setCountOrder] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('shelf_settings').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          if (data.stock_data)  setStock(data.stock_data);
          if (data.thresholds)  setThresholds(data.thresholds);
          if (data.targets)     setTargets(data.targets);
          if (data.count_order) setCountOrder(data.count_order);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [user]);

  const stateRef = useRef({});
  stateRef.current = { stock, thresholds, targets, countOrder };

  const save = (patch) => {
    if (!user) return;
    const s = stateRef.current;
    supabase.from('shelf_settings').upsert({ user_id: user.id, stock_data: s.stock, thresholds: s.thresholds, targets: s.targets, count_order: s.countOrder, ...patch }, { onConflict: 'user_id' })
      .then(({ error }) => { if (error) console.error('Save error:', error); });
  };

  const handleUpdate    = (id, qty)   => { const n = { ...stock, [id]: qty };      setStock(n);      save({ stock_data: n }); };
  const handleThreshold = (id, val)   => { const n = { ...thresholds, [id]: val }; setThresholds(n); save({ thresholds: n }); };
  const handleTarget    = (id, val)   => { const n = { ...targets, [id]: val };    setTargets(n);    save({ targets: n }); };
  const handleOrder     = (order)     => { setCountOrder(order);                                      save({ count_order: order }); };

  if (loading) return <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: T.primary, fontFamily: "'DM Sans',sans-serif", fontSize: 14, letterSpacing: 2 }}>Loading...</div></div>;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", fontFamily: "'DM Sans',sans-serif", color: T.text, position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box}input[type=number]::-webkit-inner-spin-button{opacity:1}input::placeholder{color:#b5b0aa}::-webkit-scrollbar{width:0}button{outline:none;font-family:'DM Sans',sans-serif}`}</style>
      <TopBar />
      {tab === "stock"    && <StockTab stock={stock} thresholds={thresholds} targets={targets} onUpdate={handleUpdate} />}
      {tab === "count"    && <CountTab stock={stock} thresholds={thresholds} targets={targets} countOrder={countOrder} onUpdate={handleUpdate} onFinish={() => setTab("order")} />}
      {tab === "order"    && <OrderTab stock={stock} thresholds={thresholds} targets={targets} />}
      {tab === "settings" && <SettingsTab user={user} onSignOut={onSignOut} thresholds={thresholds} onThresholdChange={handleThreshold} targets={targets} onTargetChange={handleTarget} countOrder={countOrder} onCountOrderChange={handleOrder} />}
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}