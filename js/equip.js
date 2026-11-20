// Equipment-Modell + Scheiben-Rechner
// Gewichtslogik: Kurzhanteln & SZ = nur Scheiben (ohne Stange), Kettlebell = Gesamtgewicht (Eigengewicht + Füllung)

export const IMPL_TYPES = {
  kh: 'Kurzhantel', sz: 'SZ-Stange', kb: 'Kettlebell', bar: 'Klimmzugstange', band: 'Elastikband',
  seil: 'Springseil', bank: 'Hantelbank', other: 'Sonstiges'
};

export const DEFAULT_EQUIPMENT = {
  implements: [
    { id: 'khA', type: 'kh', n: 'Kurzhantel Typ A', count: 2, base: 2, maxLoad: 10, accepts: ['A', 'B', '5er'], on: true },
    { id: 'khB', type: 'kh', n: 'Kurzhantel Typ B', count: 1, base: 2, maxLoad: 7.5, accepts: ['B'], on: true },
    { id: 'sz', type: 'sz', n: 'SZ-Stange', count: 1, base: 6, accepts: ['A', 'B', '5er', '10er'], on: true },
    { id: 'kb', type: 'kb', n: 'Kettlebell (verstellbar)', count: 1, base: 12, maxLoad: 12.5, accepts: ['A', 'B'], on: true },
    { id: 'bar', type: 'bar', n: 'Klimmzugstange', count: 1, on: true },
    { id: 'band', type: 'band', n: 'Elastikbänder (leicht, mittel)', count: 2, on: true },
    { id: 'seil', type: 'seil', n: 'Springseil', count: 1, on: true },
    { id: 'bank', type: 'bank', n: 'Hantelbank', count: 1, on: false, note: 'im Keller' }
  ],
  plates: [
    { id: 'p1', w: 1.25, type: 'A', count: 4 },
    { id: 'p2', w: 2.5, type: 'A', count: 4 },
    { id: 'p3', w: 1.25, type: 'B', count: 2 },
    { id: 'p4', w: 2.5, type: 'B', count: 2 },
    { id: 'p5', w: 5, type: '5er', count: 2 },
    { id: 'p6', w: 10, type: '10er', count: 2 }
  ]
};

const Q = 4; // Rechnen in 0,25-kg-Einheiten
const q = x => Math.round(x * Q);

export function fmtKg(x) {
  if (x == null || isNaN(x)) return '–';
  return (Math.round(x * 100) / 100).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' kg';
}

// Welche Variante ist mit dem aktuellen Equipment möglich?
export function units(eq, type) {
  const out = [];
  for (const im of eq.implements) if (im.type === type && im.on !== false)
    for (let i = 0; i < (im.count || 1); i++) out.push({ ...im, uid: im.id + '#' + i });
  return out;
}
export function variantPossible(eq, v) {
  switch (v) {
    case 'bw': return true;
    case 'kb': return units(eq, 'kb').length > 0;
    case 'kh1': return units(eq, 'kh').length > 0;
    case 'kh2': return units(eq, 'kh').length > 1;
    case 'sz': return units(eq, 'sz').length > 0;
    case 'bank': return units(eq, 'sz').length > 0 && units(eq, 'bank').length > 0;
    case 'band': return units(eq, 'band').length > 0;
    case 'bar': return units(eq, 'bar').length > 0;
    case 'seil': return units(eq, 'seil').length > 0;
  }
  return false;
}
export const isLoaded = v => ['kb', 'kh1', 'kh2', 'sz', 'bank'].includes(v);

// ── Scheiben-Löser ───────────────────────────────────────────
function kinds(eq) {
  return eq.plates.filter(p => p.count > 0 && p.w > 0).map(p => ({ w: q(p.w), type: p.type, count: p.count, real: p.w }))
    .sort((a, b) => b.w - a.w);
}
// Alle Kombinationen (Anzahl je Sorte), die genau `amt` ergeben
function combos(ks, rem, accepts, amt) {
  const res = [];
  const cur = new Array(ks.length).fill(0);
  (function rec(i, left) {
    if (left === 0) { res.push(cur.slice()); return; }
    if (i >= ks.length) return;
    const k = ks[i];
    const maxN = accepts.includes(k.type) ? Math.min(rem[i], Math.floor(left / k.w)) : 0;
    for (let n = maxN; n >= 0; n--) { cur[i] = n; rec(i + 1, left - n * k.w); if (res.length > 40) return; }
    cur[i] = 0;
  })(0, amt);
  return res;
}
// demands: [{accepts, amt (in Q)}] → Lösung (Liste von Kombis) oder null
function solve(ks, demands) {
  const rem = ks.map(k => k.count);
  const sol = [];
  // Paare (beide Seiten einer Stange) direkt hintereinander, schwerste zuerst
  const firsts = demands.map((d, i) => i).filter(i => !demands[i].mirrorOf).sort((a, b) => demands[b].amt - demands[a].amt);
  const order = [];
  for (const i of firsts) { order.push(i); const m = demands.findIndex(x => x.mirrorOf === demands[i]); if (m >= 0) order.push(m); }
  const chosen = new Map();
  function rec(j) {
    if (j === order.length) return true;
    const d = demands[order[j]];
    if (d.amt === 0) { sol[order[j]] = ks.map(() => 0); chosen.set(d, sol[order[j]]); return rec(j + 1); }
    let list = combos(ks, rem, d.accepts, d.amt);
    if (d.pairFirst) list.sort((a, b) => (b.every((n, i) => 2 * n <= rem[i]) ? 1 : 0) - (a.every((n, i) => 2 * n <= rem[i]) ? 1 : 0));
    if (d.mirrorOf && chosen.has(d.mirrorOf)) { const m = chosen.get(d.mirrorOf); if (m.every((n, i) => n <= rem[i])) list = [m, ...list]; }
    for (const c of list) {
      chosen.set(d, c);
      c.forEach((n, i) => rem[i] -= n);
      sol[order[j]] = c;
      if (rec(j + 1)) return true;
      c.forEach((n, i) => rem[i] += n);
    }
    return false;
  }
  return rec(0) ? sol : null;
}

// Anforderungen einer Variante mit Gewicht w auf konkreten Geräten
function demandsFor(v, w, unitsArr) {
  const d = [];
  if (v === 'kb') {
    const u = unitsArr[0]; const load = w - (u.base || 0);
    if (load < -0.001 || load > (u.maxLoad ?? 99) + 0.001) return null;
    d.push({ accepts: u.accepts || [], amt: q(load) });
  } else {
    for (const u of unitsArr) {
      if (u.maxLoad != null && w > u.maxLoad + 0.001) return null;
      const half = w / 2; if (Math.abs(q(half) - half * Q) > 0.01) return null;
      const a = { accepts: u.accepts || [], amt: q(half), pairFirst: true };
      d.push(a, { accepts: u.accepts || [], amt: q(half), mirrorOf: a });
    }
  }
  return d;
}
function unitChoices(eq, v) {
  const kh = units(eq, 'kh');
  if (v === 'kh1') return kh.map(u => [u]);
  if (v === 'kh2') { const r = []; for (let i = 0; i < kh.length; i++) for (let j = i + 1; j < kh.length; j++) r.push([kh[i], kh[j]]); return r; }
  if (v === 'sz' || v === 'bank') return units(eq, 'sz').map(u => [u]);
  if (v === 'kb') return units(eq, 'kb').map(u => [u]);
  return [];
}

const cache = new Map();
export function clearCache() { cache.clear(); }

// Alle machbaren Gewichte einer Variante
export function weightOptions(eq, v) {
  const key = JSON.stringify([eq.implements, eq.plates]) + v;
  if (cache.has(key)) return cache.get(key);
  const ks = kinds(eq);
  const total = eq.plates.reduce((s, p) => s + p.w * p.count, 0);
  const set = new Set();
  for (const ch of unitChoices(eq, v)) {
    if (v === 'kb') {
      const u = ch[0];
      for (let l = 0; l <= Math.min(total, u.maxLoad ?? total) + 1e-9; l += 0.25) {
        const d = demandsFor(v, u.base + l, ch); if (d && solve(ks, d)) set.add(Math.round((u.base + l) * 100) / 100);
      }
    } else {
      for (let w = 0; w <= total + 1e-9; w += 0.25) { const d = demandsFor(v, w, ch); if (d && solve(ks, d)) set.add(Math.round(w * 100) / 100); }
    }
  }
  const arr = [...set].sort((a, b) => a - b);
  cache.set(key, arr);
  return arr;
}

export function nearestOption(opts, w) {
  if (!opts.length) return null;
  let best = opts[0];
  for (const o of opts) if (Math.abs(o - w) < Math.abs(best - w)) best = o;
  return best;
}
export function stepOption(opts, w, dir) {
  if (!opts.length) return w;
  const i = opts.findIndex(o => o >= w - 1e-9);
  if (dir > 0) { if (i < 0) return opts[opts.length - 1]; return opts[Math.min(opts.length - 1, opts[i] > w + 1e-9 ? i : i + 1)]; }
  if (i < 0) return opts[opts.length - 1];
  return opts[Math.max(0, i - 1)];
}

// Beladung als Text, z. B. „pro Seite 2,5 + 1,25 (A)“
export function plateText(eq, v, w) {
  const ks = kinds(eq);
  for (const ch of unitChoices(eq, v)) {
    const d = demandsFor(v, w, ch); if (!d) continue;
    const s = solve(ks, d); if (!s) continue;
    const describe = c => c.map((n, i) => n ? Array(n).fill(fmtN(ks[i].real) + (ks.filter(k => k.real === ks[i].real).length > 1 ? ' ' + ks[i].type : '')) : []).flat().join(' + ') || 'ohne Scheiben';
    if (v === 'kb') return `${ch[0].n}: ${describe(s[0])}`;
    const tot = v === 'kh2' ? `je Hantel gesamt ${fmtKg(w + ch[0].base)}` : `gesamt ${fmtKg(w + ch[0].base)}`;
    return `pro Seite ${describe(s[0])} · ${tot}`;
  }
  return '';
}
const fmtN = x => x.toLocaleString('de-DE');

// Prüft, ob alle beladenen Geräte eines Blocks gleichzeitig mit den Scheiben bestückt werden können
// items: [{v, w}] (beide Personen). Gleiche Variante+Gewicht teilt sich das Gerät.
export function blockFeasible(eq, items) {
  const uniq = []; const seen = new Set();
  for (const it of items) { if (!isLoaded(it.v) || it.w == null) continue; const k = it.v + '|' + it.w; if (!seen.has(k)) { seen.add(k); uniq.push(it); } }
  if (!uniq.length) return { ok: true };
  const ks = kinds(eq);
  const used = new Set();
  function rec(i, dem) {
    if (i === uniq.length) return !!solve(ks, dem);
    const it = uniq[i];
    for (const ch of unitChoices(eq, it.v)) {
      if (ch.some(u => used.has(u.uid))) continue;
      const d = demandsFor(it.v, it.w, ch); if (!d) continue;
      ch.forEach(u => used.add(u.uid));
      if (rec(i + 1, dem.concat(d))) return true;
      ch.forEach(u => used.delete(u.uid));
    }
    return false;
  }
  if (rec(0, [])) return { ok: true };
  // Geräte reichen nicht oder Scheiben reichen nicht
  return { ok: false };
}
