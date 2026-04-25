'use client'
import { useState, useEffect, useRef } from "react";
import { supabase } from '@/lib/supabase'

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg: "#f7f4ef", card: "#ffffff", card2: "#f0ede8", border: "#e0dbd2",
  navBg: "#ffffff", primary: "#2d6a4f", accent: "#52b788", warn: "#e07a3a",
  red: "#d62828", green: "#2d6a4f", text: "#1a1a1a", muted: "#7a7570", dim: "#b5b0aa",
  gradA: "#2d6a4f", gradB: "#52b788",
};

// ─── STOCK DATA ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "fruit_veg", label: "Fruit & Veg", icon: "🥦",
    items: ["Tomato","Avo","Carrot","Lemon","Lime","Ginger","Mushroom","Banana","Oranges","Cucumber","Red Onions","Brown Onions","Sweet Potato","Leeks","Garlic","Kimchi"],
  },
  {
    id: "flours_sugars", label: "Flours & Sugars", icon: "🌾",
    items: ["Plain Flour","Self Raising","Caster Sugar","Light Brown Sugar","Bread Flour","GF Self Raising","Icing Sugar","Cocoa Powder","Demerara Sugar"],
  },
  {
    id: "chocolate", label: "Chocolate", icon: "🍫",
    items: ["Dark Choc","Milk Choc","White Choc","Cocoa Powder","Crispearls"],
  },
  {
    id: "sauces", label: "Sauces", icon: "🧴",
    items: ["Ketchup","Mayo","Brown","BBQ","Mojo","Mustard","Chilli Jam"],
  },
  {
    id: "shelf", label: "Shelf", icon: "🥫",
    items: ["Peanut Butter","Coconut Milk","Stock","Chipotle","Gochujang","Black Beans","Butter Beans","Cannellini Beans","Gherkins","Tuna","Chopped Tomatoes","Tinned Peppers","Maple Syrup"],
  },
  {
    id: "vinegars_oils", label: "Vinegars & Oils", icon: "🫙",
    items: ["Red Wine Vinegar","White Wine Vinegar","Balsamic Vinegar","Olive Oil","Rapeseed Oil","Coconut Oil"],
  },
  {
    id: "spices", label: "Spices", icon: "🌶️",
    items: ["Paprika","Table Salt","Maldon Salt","Pepper","Cumin","Coriander Seeds","Mixed Spice","Ground Ginger","Cinnamon","Oregano","Sesame Seeds","Baking Powder","Bicarb"],
  },
  {
    id: "baking", label: "Baking", icon: "🧁",
    items: ["Oats","Pecans","Almonds","Pumpkin Seeds","Coconut","Vanilla","Orange Oil"],
  },
  {
    id: "herbs", label: "Herbs", icon: "🌿",
    items: ["Dill","Coriander","Parsley","Thyme","Mint","Peashoots"],
  },
  {
    id: "dairy", label: "Dairy", icon: "🥛",
    items: ["Full Fat Milk","Skinny Milk","Oat Milk","Coconut Milk","Cheddar","Emmental","Buttermilk","Halloumi","Feta","Butter","Yoghurt","Cream Cheese","Creme Fraiche","Double Cream"],
  },
  {
    id: "frozen", label: "Frozen", icon: "❄️",
    items: ["Mixed Berries","Blueberries","Mango","Peas","Chocolate Ice Cream","Strawberry Ice Cream","Vanilla Ice Cream"],
  },
  {
    id: "meat", label: "Meat", icon: "🥩",
    items: ["Ham","Chorizo","Chicken","Bacon","Pork","Beef","Sausages","BP"],
  },
  {
    id: "other", label: "Other", icon: "📦",
    items: ["Hummus"],
  },
];

const ALL_ITEMS = CATEGORIES.flatMap(c => c.items.map(name => ({ id: `${c.id}__${name.toLowerCase().replace(/\s+/g,'_')}`, name, category: c.id })));

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const stockStatus = (qty, threshold) => {
  if (qty === null || qty === undefined) return "unknown";
  if (qty === 0) return "out";
  if (qty <= threshold) return "low";
  return "ok";
};

const statusColor = (status) => {
  if (status === "out") return T.red;
  if (status === "low") return T.warn;
  return T.green;
};

const statusLabel = (status) => {
  if (status === "out") return "Out";
  if (status === "low") return "Low";
  if (status === "ok") return "OK";
  return "—";
};

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: "stock",   label: "Stock",  icon: "📦" },
    { id: "low",     label: "Low",    icon: "⚠️" },
    { id: "order",   label: "Order",  icon: "📋" },
    { id: "settings",label: "Settings",icon: "⚙️" },
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

// ─── STOCK ITEM ROW ───────────────────────────────────────────────────────────
function StockRow({ item, qty, threshold, onUpdate, onThresholdChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const status = stockStatus(qty, threshold ?? 2);
  const col = statusColor(status);

  const commit = () => {
    const n = parseInt(draft);
    if (!isNaN(n) && n >= 0) onUpdate(n);
    setEditing(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", padding: "13px 16px", borderBottom: `1px solid ${T.border}`, background: status === "out" ? "#fff5f5" : status === "low" ? "#fff9f4" : T.card, transition: "background .2s" }}>
      {/* Status dot */}
      <div style={{ width: 10, height: 10, borderRadius: 5, background: col, marginRight: 12, flexShrink: 0, boxShadow: `0 0 6px ${col}88` }} />

      {/* Name */}
      <div style={{ flex: 1, fontSize: 15, color: T.text, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{item.name}</div>

      {/* Qty editor */}
      {editing ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            type="number" min="0"
            style={{ width: 64, background: T.card2, border: `2px solid ${T.primary}`, borderRadius: 10, color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 700, padding: "6px 10px", textAlign: "center", outline: "none" }}
          />
          <button onClick={commit} style={{ background: T.primary, border: "none", borderRadius: 10, color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "8px 14px", cursor: "pointer" }}>✓</button>
        </div>
      ) : (
        <button onClick={() => { setDraft(String(qty ?? "")); setEditing(true); }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", background: status === "out" ? `${T.red}15` : status === "low" ? `${T.warn}15` : `${T.green}12`, border: `1.5px solid ${col}`, borderRadius: 12, padding: "6px 14px", cursor: "pointer", minWidth: 58 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: col, fontFamily: "'DM Sans',sans-serif", lineHeight: 1 }}>
            {qty !== null && qty !== undefined ? qty : "—"}
          </span>
          <span style={{ fontSize: 9, color: col, fontFamily: "'DM Sans',sans-serif", letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600 }}>{statusLabel(status)}</span>
        </button>
      )}
    </div>
  );
}

// ─── STOCK TAB ────────────────────────────────────────────────────────────────
function StockTab({ stock, thresholds, onUpdate, onThresholdChange }) {
  const [search, setSearch] = useState("");
  const [openCat, setOpenCat] = useState(null);

  const filtered = search.trim()
    ? CATEGORIES.map(c => ({ ...c, items: c.items.filter(i => i.toLowerCase().includes(search.toLowerCase())) })).filter(c => c.items.length > 0)
    : CATEGORIES;

  const lowCount = ALL_ITEMS.filter(i => { const s = stockStatus(stock[i.id], thresholds[i.id] ?? 2); return s === "low" || s === "out"; }).length;

  return (
    <div style={{ paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ padding: "56px 16px 16px", background: T.card, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Sans',sans-serif" }}>Hips Social</div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontSize: 32, fontFamily: "'Lora',serif", fontWeight: 700, color: T.text }}>Stock</div>
          {lowCount > 0 && (
            <div style={{ background: `${T.warn}20`, border: `1px solid ${T.warn}`, borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>⚠️</span>
              <span style={{ fontSize: 12, color: T.warn, fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>{lowCount} items low</span>
            </div>
          )}
        </div>
        {/* Search */}
        <div style={{ marginTop: 12, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: T.dim }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items..."
            style={{ width: "100%", boxSizing: "border-box", background: T.card2, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: 15, padding: "11px 14px 11px 38px", outline: "none" }}
          />
        </div>
      </div>

      {/* Categories */}
      {filtered.map(cat => {
        const catLow = cat.items.filter(name => {
          const itemId = ALL_ITEMS.find(i => i.name === name && i.category === cat.id)?.id;
          const s = stockStatus(stock[itemId], thresholds[itemId] ?? 2);
          return s === "low" || s === "out";
        }).length;
        const isOpen = openCat === cat.id || search.trim();

        return (
          <div key={cat.id}>
            {!search.trim() && (
              <button onClick={() => setOpenCat(isOpen ? null : cat.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: T.bg, border: "none", borderBottom: `1px solid ${T.border}`, cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 22 }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: "'DM Sans',sans-serif" }}>{cat.label}</div>
                  <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>{cat.items.length} items</div>
                </div>
                {catLow > 0 && (
                  <div style={{ background: T.warn, borderRadius: 10, padding: "2px 8px" }}>
                    <span style={{ fontSize: 11, color: "#fff", fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>{catLow} low</span>
                  </div>
                )}
                <span style={{ color: T.dim, fontSize: 14 }}>{isOpen ? "▲" : "▼"}</span>
              </button>
            )}
            {isOpen && (
              <div style={{ background: T.card }}>
                {cat.items.map(name => {
                  const item = ALL_ITEMS.find(i => i.name === name && i.category === cat.id);
                  if (!item) return null;
                  return (
                    <StockRow
                      key={item.id}
                      item={item}
                      qty={stock[item.id] ?? null}
                      threshold={thresholds[item.id] ?? 2}
                      onUpdate={v => onUpdate(item.id, v)}
                      onThresholdChange={v => onThresholdChange(item.id, v)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── LOW STOCK TAB ────────────────────────────────────────────────────────────
function LowTab({ stock, thresholds, onUpdate }) {
  const lowItems = ALL_ITEMS.filter(i => {
    const s = stockStatus(stock[i.id], thresholds[i.id] ?? 2);
    return s === "low" || s === "out";
  });

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: "56px 16px 16px", background: T.card, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Sans',sans-serif" }}>Needs Attention</div>
        <div style={{ fontSize: 32, fontFamily: "'Lora',serif", fontWeight: 700, color: T.text }}>Low Stock</div>
      </div>

      {lowItems.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 18, color: T.text, fontFamily: "'Lora',serif", fontWeight: 700, marginBottom: 6 }}>All stocked up</div>
          <div style={{ fontSize: 14, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>Nothing is running low right now</div>
        </div>
      ) : (
        <div style={{ background: T.card }}>
          {/* Out of stock */}
          {lowItems.filter(i => stockStatus(stock[i.id], thresholds[i.id] ?? 2) === "out").length > 0 && (
            <>
              <div style={{ padding: "10px 16px 6px", background: `${T.red}10`, borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 11, color: T.red, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Out of Stock</span>
              </div>
              {lowItems.filter(i => stockStatus(stock[i.id], thresholds[i.id] ?? 2) === "out").map(item => (
                <StockRow key={item.id} item={item} qty={stock[item.id] ?? null} threshold={thresholds[item.id] ?? 2} onUpdate={v => onUpdate(item.id, v)} onThresholdChange={() => {}} />
              ))}
            </>
          )}
          {/* Running low */}
          {lowItems.filter(i => stockStatus(stock[i.id], thresholds[i.id] ?? 2) === "low").length > 0 && (
            <>
              <div style={{ padding: "10px 16px 6px", background: `${T.warn}10`, borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 11, color: T.warn, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Running Low</span>
              </div>
              {lowItems.filter(i => stockStatus(stock[i.id], thresholds[i.id] ?? 2) === "low").map(item => (
                <StockRow key={item.id} item={item} qty={stock[item.id] ?? null} threshold={thresholds[item.id] ?? 2} onUpdate={v => onUpdate(item.id, v)} onThresholdChange={() => {}} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ORDER TAB ────────────────────────────────────────────────────────────────
function OrderTab({ stock, thresholds }) {
  const [copied, setCopied] = useState(false);
  const lowItems = ALL_ITEMS.filter(i => {
    const s = stockStatus(stock[i.id], thresholds[i.id] ?? 2);
    return s === "low" || s === "out";
  });

  const orderText = lowItems.length === 0
    ? "All stock levels are good — nothing to order."
    : `ORDER LIST — ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}\n\n` +
      CATEGORIES.map(cat => {
        const catItems = lowItems.filter(i => i.category === cat.id);
        if (!catItems.length) return null;
        return `${cat.label}:\n` + catItems.map(i => {
          const s = stockStatus(stock[i.id], thresholds[i.id] ?? 2);
          return `  - ${i.name} (${s === "out" ? "OUT" : `qty: ${stock[i.id]}`})`;
        }).join("\n");
      }).filter(Boolean).join("\n\n");

  const copy = () => {
    navigator.clipboard.writeText(orderText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: "56px 16px 16px", background: T.card, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Sans',sans-serif" }}>Auto Generated</div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontSize: 32, fontFamily: "'Lora',serif", fontWeight: 700, color: T.text }}>Order List</div>
          {lowItems.length > 0 && (
            <button onClick={copy} style={{ background: copied ? T.green : T.primary, border: "none", borderRadius: 12, color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, padding: "8px 16px", cursor: "pointer", transition: "background .2s" }}>
              {copied ? "✓ Copied!" : "Copy List"}
            </button>
          )}
        </div>
      </div>

      {lowItems.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 18, color: T.text, fontFamily: "'Lora',serif", fontWeight: 700, marginBottom: 6 }}>Nothing to order</div>
          <div style={{ fontSize: 14, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>All stock levels are good</div>
        </div>
      ) : (
        <div>
          <div style={{ padding: "12px 16px", background: `${T.primary}10`, borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 13, color: T.primary, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · {lowItems.length} items to order
            </span>
          </div>
          {CATEGORIES.map(cat => {
            const catItems = lowItems.filter(i => i.category === cat.id);
            if (!catItems.length) return null;
            return (
              <div key={cat.id}>
                <div style={{ padding: "10px 16px 6px", background: T.bg, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{cat.icon}</span>
                  <span style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{cat.label}</span>
                </div>
                {catItems.map(item => {
                  const s = stockStatus(stock[item.id], thresholds[item.id] ?? 2);
                  return (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${T.border}`, background: T.card }}>
                      <div style={{ width: 10, height: 10, borderRadius: 5, background: statusColor(s), marginRight: 12, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 15, color: T.text, fontFamily: "'DM Sans',sans-serif" }}>{item.name}</span>
                      <span style={{ fontSize: 12, color: s === "out" ? T.red : T.warn, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", background: s === "out" ? `${T.red}15` : `${T.warn}15`, borderRadius: 8, padding: "3px 10px" }}>
                        {s === "out" ? "OUT" : `qty: ${stock[item.id]}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab({ user, onSignOut, thresholds, onThresholdChange, stock, onUpdate }) {
  const [expandedItem, setExpandedItem] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? ALL_ITEMS.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : ALL_ITEMS;

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: "56px 16px 16px", background: T.card, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Sans',sans-serif" }}>Hips Social</div>
        <div style={{ fontSize: 32, fontFamily: "'Lora',serif", fontWeight: 700, color: T.text, marginBottom: 16 }}>Settings</div>
        <div style={{ background: T.card2, borderRadius: 14, padding: "12px 16px", border: `1px solid ${T.border}`, marginBottom: 0 }}>
          <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans',sans-serif", marginBottom: 4 }}>Signed in as</div>
          <div style={{ fontSize: 14, color: T.text, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, marginBottom: 12 }}>{user?.email}</div>
          <button onClick={onSignOut} style={{ width: "100%", background: "transparent", border: `1px solid ${T.red}`, borderRadius: 10, color: T.red, fontFamily: "'DM Sans',sans-serif", fontSize: 14, padding: "10px", cursor: "pointer" }}>Sign Out</button>
        </div>
      </div>

      {/* Low stock thresholds */}
      <div style={{ padding: "16px 16px 8px", background: T.bg }}>
        <div style={{ fontSize: 13, color: T.muted, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Low Stock Thresholds</div>
        <div style={{ fontSize: 13, color: T.muted, fontFamily: "'DM Sans',sans-serif", marginBottom: 10 }}>Set at what quantity an item turns orange. Default is 2.</div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search items..."
          style={{ width: "100%", boxSizing: "border-box", background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: 15, padding: "10px 14px", outline: "none", marginBottom: 4 }}
        />
      </div>
      <div style={{ background: T.card }}>
        {filtered.map(item => {
          const current = thresholds[item.id] ?? 2;
          const isOpen = expandedItem === item.id;
          return (
            <div key={item.id} style={{ borderBottom: `1px solid ${T.border}` }}>
              <div onClick={() => setExpandedItem(isOpen ? null : item.id)}
                style={{ display: "flex", alignItems: "center", padding: "12px 16px", cursor: "pointer" }}>
                <span style={{ flex: 1, fontSize: 14, color: T.text, fontFamily: "'DM Sans',sans-serif" }}>{item.name}</span>
                <span style={{ fontSize: 13, color: T.warn, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, marginRight: 8 }}>warn at {current}</span>
                <span style={{ color: T.dim, fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
              </div>
              {isOpen && (
                <div style={{ padding: "0 16px 14px", display: "flex", gap: 8, alignItems: "center" }}>
                  {[1,2,3,5,10].map(n => (
                    <button key={n} onClick={() => onThresholdChange(item.id, n)}
                      style={{ flex: 1, background: current === n ? T.primary : T.card2, border: `1px solid ${current === n ? T.primary : T.border}`, borderRadius: 10, color: current === n ? "#fff" : T.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: current === n ? 700 : 400, padding: "10px 0", cursor: "pointer" }}>
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TOP BAR ─────────────────────────────────────────────────────────────────
function TopBar({ tab }) {
  const labels = { stock: "Stock", low: "Low Stock", order: "Order List", settings: "Settings" };
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

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ShelfApp({ user, onSignOut }) {
  const [tab, setTab] = useState("stock");
  const [stock, setStock] = useState({});
  const [thresholds, setThresholds] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('shelf_settings').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          if (data.stock_data) setStock(data.stock_data);
          if (data.thresholds) setThresholds(data.thresholds);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [user]);

  const stateRef = useRef({ stock: {}, thresholds: {} });
  stateRef.current = { stock, thresholds };

  const save = (patch) => {
    if (!user) return;
    const s = stateRef.current;
    supabase.from('shelf_settings').upsert({ user_id: user.id, stock_data: s.stock, thresholds: s.thresholds, ...patch }, { onConflict: 'user_id' })
      .then(({ error }) => { if (error) console.error('Save error:', error); });
  };

  const handleUpdate = (itemId, qty) => {
    const newStock = { ...stock, [itemId]: qty };
    setStock(newStock);
    save({ stock_data: newStock });
  };

  const handleThreshold = (itemId, val) => {
    const newT = { ...thresholds, [itemId]: val };
    setThresholds(newT);
    save({ thresholds: newT });
  };

  if (loading) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: T.primary, fontFamily: "'DM Sans',sans-serif", fontSize: 14, letterSpacing: 2 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", fontFamily: "'DM Sans',sans-serif", color: T.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box}input[type=number]::-webkit-inner-spin-button{opacity:1}input::placeholder{color:#b5b0aa}::-webkit-scrollbar{width:0}button{outline:none;font-family:'DM Sans',sans-serif}`}</style>

      <TopBar tab={tab} />

      {tab === "stock"    && <StockTab stock={stock} thresholds={thresholds} onUpdate={handleUpdate} onThresholdChange={handleThreshold} />}
      {tab === "low"      && <LowTab stock={stock} thresholds={thresholds} onUpdate={handleUpdate} />}
      {tab === "order"    && <OrderTab stock={stock} thresholds={thresholds} />}
      {tab === "settings" && <SettingsTab user={user} onSignOut={onSignOut} thresholds={thresholds} onThresholdChange={handleThreshold} stock={stock} onUpdate={handleUpdate} />}

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
