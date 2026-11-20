// Auswertung der Historie + Trainingsempfehlung
import { EX, EXERCISES, PATTERNS, MAIN_PATTERNS, FORMATS, ZONES } from './data.js';
import { variantPossible, isLoaded, weightOptions, nearestOption, stepOption, units, blockFeasible } from './equip.js';

const H = 3600e3, DAY = 24 * H;
export const RECOVERY_H = 48;

export function doneEntries(state) {
  return state.entries.filter(e => e.done && !e.deleted).sort((a, b) => b.ts - a.ts);
}
export function itemRounds(block, item, entry) {
  const p = item.e; if (p && p.rr && p.rr.length) return p.rr.length;
  return block.rounds || 1;
}
const factor = (entry) => entry.format === 'hiit' ? 0.6 : 1;

// Muskelzonen-Belastung einer Person
export function zoneStatus(state, now = Date.now(), who = 'e') {
  const res = Object.fromEntries(Object.keys(ZONES).map(z => [z, { last: null, lastSets: 0, sets7: 0, exs: [] }]));
  for (const en of doneEntries(state)) {
    const age = now - en.ts;
    const perZone = {};
    for (const b of en.blocks || []) for (const it of b.items) {
      const p = it[who]; if (!p || !EX[p.ex]) continue;
      const sets = itemRounds(b, it, en) * factor(en);
      for (const [z, f] of Object.entries(EX[p.ex].m)) {
        perZone[z] = (perZone[z] || 0) + sets * f;
        if (f >= 1 && res[z].exs.length < 4 && !res[z].exs.includes(EX[p.ex].n) && res[z].last == null) res[z].exs.push(EX[p.ex].n);
      }
    }
    for (const [z, s] of Object.entries(perZone)) {
      if (s < 0.9) continue;
      if (res[z].last == null) { res[z].last = en.ts; res[z].lastSets = s; }
      else if (en.ts > res[z].last - 6 * H) res[z].lastSets += 0; // gleiche Einheit
      if (age < 7 * DAY) res[z].sets7 += s;
    }
  }
  return res;
}

// 0..1 Leuchtstärke für die Körperkarte
export function glow(z, now = Date.now()) {
  if (!z.last) return 0;
  const h = (now - z.last) / H;
  if (h > 96) return 0;
  const base = h < 24 ? 1 : h < 48 ? 0.72 : h < 72 ? 0.45 : 0.2;
  return base * Math.min(1, 0.55 + z.lastSets / 8);
}
export function hoursAgo(ts, now = Date.now()) { return (now - ts) / H; }
export function agoText(ts, now = Date.now()) {
  if (!ts) return 'noch nie';
  const h = (now - ts) / H;
  if (h < 1) return 'gerade eben';
  if (h < 20) return `vor ${Math.round(h)} Std.`;
  const d = Math.round(h / 24);
  return d === 1 ? 'gestern' : `vor ${d} Tagen`;
}

export function patternStats(state, now = Date.now(), who = 'e') {
  const res = Object.fromEntries(Object.keys(PATTERNS).map(p => [p, { last: null, n7: 0 }]));
  for (const en of doneEntries(state)) {
    const hit = new Set();
    for (const b of en.blocks || []) for (const it of b.items) { const p = it[who]; if (p && EX[p.ex]) hit.add(EX[p.ex].p); }
    for (const p of hit) { if (res[p].last == null) res[p].last = en.ts; if (now - en.ts < 7 * DAY) res[p].n7++; }
  }
  return res;
}

// Ist ein Muster heute blockiert (Hauptmuskeln < 48 h und ordentlich belastet)?
export function patternBlocked(zs, p, now = Date.now()) {
  const zones = PATTERNS[p].zones;
  for (const z of zones) {
    const s = zs[z];
    if (s.last && (now - s.last) / H < RECOVERY_H && s.lastSets >= 3) return { z, ts: s.last };
  }
  return null;
}

// Letzte Leistung einer Person für Übung (+Variante)
export function lastPerf(state, who, exId, v, excludeId) {
  for (const en of doneEntries(state)) {
    if (en.id === excludeId) continue;
    for (const b of en.blocks || []) for (const it of b.items) {
      const p = it[who];
      if (p && p.ex === exId && (!v || p.v === v)) return { ...p, rounds: itemRounds(b, it, en), ts: en.ts, format: en.format, kbWeight: b.kbWeight };
    }
  }
  return null;
}
export function lastVariant(state, who, exId) { const l = lastPerf(state, who, exId); return l ? l.v : null; }

function usage(state, who, days = 42, now = Date.now()) {
  const u = {};
  for (const en of doneEntries(state)) {
    if (now - en.ts > days * DAY) break;
    for (const b of en.blocks || []) for (const it of b.items) { const p = it[who]; if (p) u[p.ex] = (u[p.ex] || 0) + 1; }
  }
  return u;
}

export function repRange(format) { return FORMATS[format].reps || [8, 12]; }

// Doppelprogression: alle Runden an der Obergrenze → nächste Gewichtsstufe
export function progression(state, eq, who, exId, v, format) {
  const l = lastPerf(state, who, exId, v);
  if (!l || !isLoaded(v) || FORMATS[format].timed) return null;
  const lo = repRange(format)[0];
  let hi = (FORMATS[l.format] && !FORMATS[l.format].timed ? repRange(l.format) : repRange(format))[1];
  const ex = EX[exId];
  if (ex.r0 && ex.r0 > hi) hi = ex.r0 + 5;
  const reps = l.rr && l.rr.length ? l.rr.map(r => r.reps) : Array(l.rounds).fill(l.reps);
  if (reps.length && reps.every(r => r >= hi) && EX[exId].u !== 's' && EX[exId].u !== 'm') {
    const opts = weightOptions(eq, v);
    const next = stepOption(opts, l.w, +1);
    if (next > l.w) return { from: l.w, to: next, reps: ex.r0 && ex.r0 > lo + 4 ? ex.r0 : lo, last: reps };
  }
  return null;
}

// ── Vorschlag erzeugen ─────────────────────────────────────
const needsPartner = e => /zu zweit/.test(e.n);

function variantOk(eq, ex, v, mode, format) {
  if (!ex.v.includes(v) || !variantPossible(eq, v)) return false;
  if (mode === 'travel') return v === 'bw' && ['u', 'm', 't'].includes(ex.av);
  if (format === 'kb') return v === 'kb';
  return true;
}
function capacity(eq) {
  return { kh: units(eq, 'kh').length, sz: units(eq, 'sz').length, kb: units(eq, 'kb').length, bar: units(eq, 'bar').length };
}
function needs(v) {
  return { kh1: { kh: 1 }, kh2: { kh: 2 }, sz: { sz: 1 }, bank: { sz: 1 }, kb: { kb: 1 }, bar: { bar: 1 } }[v] || {};
}
function fits(used, cap, v, shareKb) {
  for (const [k, n] of Object.entries(needs(v))) { if (k === 'kb' && shareKb) continue; if ((used[k] || 0) + n > (cap[k] || 0)) return false; }
  return true;
}
function take(used, v) { for (const [k, n] of Object.entries(needs(v))) used[k] = (used[k] || 0) + n; }

function typeOk(ex, format) {
  const kind = FORMATS[format].kind;
  if (kind === 'K') return ex.t.includes('K');
  if (kind === 'HIIT') return ex.t.includes('HIIT') && !ex.tech;
  if (kind === 'KB') return ex.v.includes('kb') && (ex.t.includes('K') || ex.t.includes('HIIT'));
  return true;
}

export function candidates(state, eq, { pattern, format, mode, duo, who = 'e', usedEx = new Set() }) {
  const u = usage(state, who);
  const last = doneEntries(state).find(e => e.format === format);
  const lastSet = new Set(); if (last) for (const b of last.blocks) for (const it of b.items) if (it[who]) lastSet.add(it[who].ex);
  const histDistinct = EXERCISES.filter(e => e.p === pattern && u[e.id]).length;
  return EXERCISES.filter(ex => (pattern ? ex.p === pattern : true) && typeOk(ex, format) && (duo || !needsPartner(ex)) && !usedEx.has(ex.id)
    && ex.v.some(v => variantOk(eq, ex, v, mode, format)))
    .map(ex => {
      let s = (ex.pref || 0) / 2 + (ex.star ? 1 : 0) + Math.min(6, 2 * (u[ex.id] || 0));
      if (lastSet.has(ex.id) && histDistinct >= 2) s -= 2.5;
      if (duo && ex.partner) s += 2;
      if (ex.t.includes('M') && !ex.t.includes('K')) s -= 5;
      return { ex, s };
    }).sort((a, b) => b.s - a.s);
}

function defaultReps(ex, format) {
  const f = FORMATS[format];
  if (f.timed) return null;
  if (ex.u === 's') return format === 'k2' ? 30 : 40;
  if (ex.u === 'm') return 25;
  if (ex.r0) return ex.r0;
  if (format === 'kb') return 10;
  return f.reps[0] + 2;
}

function chooseWeight(state, eq, who, ex, v, format, eRef) {
  if (!isLoaded(v)) return null;
  const opts = weightOptions(eq, v);
  if (!opts.length) return null;
  const lp = lastPerf(state, who, ex.id, v);
  if (FORMATS[format].timed) {
    const k = lp && !FORMATS[lp.format]?.timed ? lp.w : (ex.w0?.[v] ?? opts[0]);
    return { w: nearestOption(opts, (lp && FORMATS[lp.format]?.timed) ? lp.w : k * 0.55) };
  }
  const pr = progression(state, eq, who, ex.id, v, format);
  if (pr) return { w: pr.to, prog: pr };
  if (lp) return { w: lp.w };
  if (who === 'j') {
    if (eRef && eRef.v === v && eRef.w != null) return { w: nearestOption(opts, eRef.w * 0.5) };
    return { w: nearestOption(opts, (ex.w0?.[v] ?? opts[0]) * 0.6) };
  }
  return { w: nearestOption(opts, ex.w0?.[v] ?? opts[Math.floor(opts.length / 3)]) };
}

export function makePerson(state, eq, who, ex, v, format, eRef) {
  const p = { ex: ex.id, v };
  const wc = chooseWeight(state, eq, who, ex, v, format, eRef);
  if (wc) { p.w = wc.w; if (wc.prog) p.prog = { from: wc.prog.from, last: wc.prog.last }; }
  const lp = lastPerf(state, who, ex.id, v);
  const r = defaultReps(ex, format);
  if (r != null) p.reps = wc?.prog ? (ex.r0 && ex.r0 > 12 ? ex.r0 : FORMATS[format].reps[0]) : (lp && lp.reps && lp.format === format ? lp.reps : r);
  return p;
}

function pickVariant(state, eq, who, ex, mode, format, used, cap, preferOrder) {
  const lv = lastVariant(state, who, ex.id);
  const order = [...new Set([lv, ...(preferOrder || ex.v)].filter(Boolean))].filter(v => ex.v.includes(v));
  for (const v of order) if (variantOk(eq, ex, v, mode, format) && fits(used, cap, v, format === 'kb')) return v;
  return null;
}

export function suggestFormat(state, now = Date.now(), mode = 'home') {
  const done = doneEntries(state);
  if (!done.length) return 'k3';
  const week = done.filter(e => now - e.ts < 7 * DAY);
  const lastOf = f => (done.find(e => e.format === f) || { ts: 0 }).ts;
  if (week.length >= 2 && !week.some(e => e.format === 'hiit' || e.format === 'kb')) {
    const f = lastOf('hiit') <= lastOf('kb') ? 'hiit' : 'kb';
    return mode === 'travel' && f === 'kb' ? 'hiit' : f;
  }
  return lastOf('k3') <= lastOf('k2') ? 'k3' : 'k2';
}

// Hauptfunktion: kompletten Eintrag vorbefüllen
export function buildPlan(state, eq, { format, mode = 'home', duo = false, runSoon = false, now = Date.now() }) {
  const F = FORMATS[format];
  const zs = zoneStatus(state, now, 'e');
  const ps = patternStats(state, now, 'e');
  const notes = [];
  const cap = capacity(eq);
  const due = p => (ps[p].last ? Math.min(7, (now - ps[p].last) / DAY) : 7) + (2 - ps[p].n7) * 1.5;

  // Slots anpassen: blockierte Muster ersetzen
  let slots = F.slots.map(b => b.slice());
  const count = {};
  slots.flat().forEach(p => count[p] = (count[p] || 0) + 1);
  const blocked = {};
  for (const p of MAIN_PATTERNS) { if (p === 'core') continue; const b = patternBlocked(zs, p, now); if (b) blocked[p] = b; }
  const nBlocked = Object.keys(blocked).length;
  let warn = null;
  if (nBlocked >= 4) { warn = 'Fast alle Muskelgruppen sind noch in Erholung (< 48 h). Heute lieber laufen, Mobility oder Pause – oder bewusst leicht trainieren.'; for (const k in blocked) delete blocked[k]; }
  let lowerKept = 0;
  slots = slots.map(block => block.map(p => {
    const lower = PATTERNS[p]?.lower;
    let reason = null;
    if (blocked[p]) reason = `${ZONES[blocked[p].z]} noch in Erholung (${agoText(blocked[p].ts, now)})`;
    else if (runSoon && lower && format !== 'kb') { if (lowerKept >= 1) reason = 'Lauf geplant – Beine heute nur 1×'; else lowerKept++; }
    if (!reason) return p;
    const alt = MAIN_PATTERNS.filter(q => q !== p && !blocked[q] && !PATTERNS[q].lower && (count[q] || 0) < 2 && !block.includes(q))
      .sort((a, b) => due(b) - due(a))[0] || 'iso';
    count[alt] = (count[alt] || 0) + 1;
    notes.push(`${PATTERNS[p].n} → ${PATTERNS[alt].n}: ${reason}`);
    return alt;
  }));

  const usedEx = { e: new Set(), j: new Set() };
  const built = [];
  const jFormat = format === 'kb' ? 'k3' : format; // Jenny hat im KB-Circuit keine eigene KB
  const jOrder = ['kh1', 'kh2', 'band', 'bw', 'kb', 'sz', 'bank', 'bar', 'seil'].filter(v => !(format === 'kb' && v === 'kb'));
  const blocks = slots.map(block => {
    const used = {};
    const items = [];
    for (const p of block) {
      let pattern = p;
      let list = candidates(state, eq, { pattern, format, mode, duo, usedEx: usedEx.e });
      if (pattern === 'iso') {
        // Isolation: Zone mit längster Pause bevorzugen, Arme abwechseln
        list = list.map(c => {
          const zz = Object.keys(c.ex.m).filter(z => c.ex.m[z] >= 1);
          const fresh = Math.min(...zz.map(z => zs[z].last ? (now - zs[z].last) / DAY : 7));
          const hitAlready = items.concat(...built.map(b => b.items)).some(it => it.e && Object.keys(EX[it.e.ex].m).some(z => EX[it.e.ex].m[z] >= 1 && zz.includes(z)));
          const arms = zz.some(z => z === 'biceps' || z === 'triceps') ? 1.5 : 0;
          return { ...c, s: c.s + fresh * 0.4 + arms - (hitAlready ? 4 : 0) };
        }).sort((a, b) => b.s - a.s);
      }
      // Kandidaten durchgehen: Variante muss Geräte-frei sein UND die Scheiben müssen für das ganze Set gleichzeitig reichen
      const flat = () => items.flatMap(x => ['e', 'j'].map(w => x[w]).filter(Boolean).map(q => ({ v: q.v, w: q.w })));
      const kbW = format === 'kb' ? (doneEntries(state).find(x => x.format === 'kb')?.blocks?.[0]?.kbWeight ?? 17) : null;
      let it = null, fallback = null;
      outer: for (const c of list) {
        const lv = lastVariant(state, 'e', c.ex.id);
        const vOrder = [...new Set([lv, ...c.ex.v].filter(Boolean))].filter(v => c.ex.v.includes(v));
        for (const ve of vOrder) {
          if (!variantOk(eq, c.ex, ve, mode, format) || !fits(used, cap, ve, format === 'kb')) continue;
          const cand = { pat: pattern, e: makePerson(state, eq, 'e', c.ex, ve, format) };
          if (kbW != null && ve === 'kb') cand.e.w = kbW;
          const usedTmp = { ...used }; take(usedTmp, ve);
          if (duo) {
            let jex = c.ex;
            let vj = pickVariant(state, eq, 'j', c.ex, mode, jFormat, usedTmp, cap, c.ex.v.filter(v => jOrder.includes(v)));
            if (!vj && needsPartner(c.ex)) continue;
            if (!vj) {
              for (const c2 of candidates(state, eq, { pattern, format: jFormat, mode, duo: false, who: 'j', usedEx: usedEx.j })) {
                if (c2.ex.partner && c2.ex.id !== 'nordic') continue;
                const v2 = pickVariant(state, eq, 'j', c2.ex, mode, jFormat, usedTmp, cap, c2.ex.v.filter(v => jOrder.includes(v)));
                if (v2) { jex = c2.ex; vj = v2; break; }
              }
            }
            if (vj) { cand.j = makePerson(state, eq, 'j', jex, vj, format, cand.e); cand._vj = vj; }
          }
          if (!fallback) fallback = cand;
          const test = flat().concat([cand.e, cand.j].filter(Boolean).map(q => ({ v: q.v, w: q.w })));
          if (blockFeasible(eq, test).ok) { it = cand; break outer; }
        }
      }
      it = it || fallback;
      if (!it) continue;
      take(used, it.e.v); usedEx.e.add(it.e.ex);
      if (it.j) { take(used, it._vj); usedEx.j.add(it.j.ex); delete it._vj; }
      items.push(it);
    }
    const b = { rounds: F.rounds, items };
    built.push(b);
    return b;
  });

  if (format === 'kb') {
    for (const b of blocks) {
      const last = doneEntries(state).find(e => e.format === 'kb');
      const opts = weightOptions(eq, 'kb');
      let w = last?.blocks?.[0]?.kbWeight ?? nearestOption(opts, 17);
      let prog = null;
      if (last) {
        const all = last.blocks[0].items.every(it => it.e && (it.e.rr?.length ? it.e.rr.every(r => r.reps >= (it.e.ex === 'kbswing' ? 20 : 12)) : it.e.reps >= (it.e.ex === 'kbswing' ? 20 : 12)));
        if (all) { const n = stepOption(opts, w, +1); if (n > w) { prog = { from: w }; w = n; } }
      }
      b.kbWeight = w; if (prog) b.kbProg = prog;
      for (const it of b.items) it.e.w = w;
    }
  }
  if (F.timed) return { format, mode, duo, runSoon, blocks, hiit: { work: F.work, rest: F.rest, rounds: F.rounds, roundPause: F.roundPause }, notes, warn };
  return { format, mode, duo, runSoon, blocks, notes, warn };
}

// Zusammenfassung für die Startseite
export function todaySummary(state, now = Date.now()) {
  const done = doneEntries(state);
  const zs = zoneStatus(state, now);
  const ps = patternStats(state, now);
  const last = done[0] || null;
  const recovering = Object.entries(zs).filter(([z, s]) => s.last && (now - s.last) / H < RECOVERY_H && s.lastSets >= 3).map(([z]) => z);
  const due = MAIN_PATTERNS.filter(p => !patternBlocked(zs, p, now))
    .map(p => ({ p, d: ps[p].last ? (now - ps[p].last) / DAY : 99, n7: ps[p].n7 }))
    .sort((a, b) => (b.d + (2 - b.n7) * 1.5) - (a.d + (2 - a.n7) * 1.5));
  const week = done.filter(e => now - e.ts < 7 * DAY).length;
  return { last, zs, ps, recovering, due, week };
}
