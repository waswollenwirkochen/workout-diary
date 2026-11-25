import { EX, EXERCISES, PATTERNS, MAIN_PATTERNS, REGIONS, VARIANTS, AVAIL, ZONES, FORMATS, WARMUP_GENERAL, STRETCHES } from './data.js';
import { IMPL_TYPES, variantPossible, isLoaded, weightOptions, stepOption, nearestOption, plateText, blockFeasible, fmtKg, clearCache, DEFAULT_EQUIPMENT } from './equip.js';
import { buildPlan, suggestFormat, todaySummary, zoneStatus, glow, agoText, lastPerf, lastVariant, makePerson, doneEntries, progression } from './plan.js';
import { bodySVG, paintBody, stretchSVG } from './body.js';
import { DETAILS, DEFAULT_BREATH } from './details.js';
import { load, saveLocal, syncCfg, setSyncCfg, sync, merge } from './store.js';
import { runTimer, countdown, speak, stopSpeak } from './timer.js';
import { POSE, POSES, PROGRAMS, PROGRAM, THEMES, FOCUS, TAGS, TAG_ZONES, PLACES, planSession, planSeconds, programItems, buildCustom, withPartner, poseSVG, BREATH, TRANS, SWITCH } from './yoga.js';

let S = load();
const ui = { y: { travel: false, duo: false, prog: null, custom: { focus: [], style: 'ruhig', place: 'm' } }, view: 'start', editId: null, sheet: null, more: new Set(), tips: true, zone: null, histWho: 'e', sync: 'idle', syncMsg: '' };
const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const fmtDate = ts => { const d = new Date(ts); return `${WD[d.getDay()]}, ${d.getDate()}.${d.getMonth() + 1}.`; };
const fmtTime = ts => new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
const num = x => (Math.round(x * 100) / 100).toLocaleString('de-DE');
const eqp = () => S.equipment;

// ── Speichern & Sync ──────────────────────────────────────
let syncTimer = null;
function persist(touch = true) {
  if (touch) S.updatedAt = Date.now();
  saveLocal(S);
  scheduleSync();
}
function scheduleSync(delay = 2500) {
  if (!syncCfg().token) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(doSync, delay);
}
async function doSync(manual) {
  const cfg = syncCfg();
  if (!cfg.token) { if (manual) toast('Erst Token eintragen'); return; }
  ui.sync = 'busy'; paintSync();
  try {
    const merged = await sync(cfg, S);
    S = merged; saveLocal(S);
    ui.sync = 'ok'; ui.syncMsg = 'Synchronisiert ' + fmtTime(Date.now());
    if (!document.activeElement || !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) render();
    if (manual) toast('Synchronisiert ✓');
  } catch (e) {
    ui.sync = 'err'; ui.syncMsg = e.message;
    if (manual) toast(e.message);
  }
  paintSync();
}
function paintSync() {
  document.querySelectorAll('.syncdot').forEach(d => d.className = 'syncdot ' + (ui.sync === 'idle' ? '' : ui.sync));
  const m = $('#syncmsg'); if (m) m.textContent = ui.syncMsg;
}

function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}

// ── Einträge ─────────────────────────────────────────────
const draft = duo => S.entries.find(e => !e.done && !e.deleted && !!e.duo === !!duo);
const entry = id => S.entries.find(e => e.id === id);

function newEntry(duo) {
  const mode = S.settings.lastMode || 'home';
  const format = suggestFormat(S, Date.now(), mode);
  const plan = buildPlan(S, eqp(), { format, mode, duo });
  const e = {
    id: uid(), ts: Date.now(), updatedAt: Date.now(), done: false, duo, suggested: format,
    ...plan, warmup: { type: 'rope', min: S.settings.rope || 3 }, stretch: { min: S.settings.stretch || 8, list: [] }, note: '', touched: false
  };
  S.entries.unshift(e);
  persist();
  return e;
}
function regenerate(e, patch = {}) {
  Object.assign(e, patch);
  const plan = buildPlan(S, eqp(), { format: e.format, mode: e.mode, duo: e.duo, runSoon: e.runSoon });
  e.blocks = plan.blocks; e.notes = plan.notes; e.warn = plan.warn; e.hiit = plan.hiit;
  e.touched = false; e.updatedAt = Date.now();
}
function touch(e) { e.touched = true; e.updatedAt = Date.now(); persist(); }

// ── Rendering ────────────────────────────────────────────
const ICONS = {
  yoga: '<svg viewBox="0 0 24 24"><circle cx="12" cy="4.5" r="2.2"/><path d="M12 7.5v6M5 10.5c2.5 1.5 4.5 2.5 7 3 2.5-.5 4.5-1.5 7-3M5 19.5c3-1 4.5-3 7-6 2.5 3 4 5 7 6M4 20.5h16"/></svg>',
  start: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.5"/><path d="M12 8v7M8 11h8M10 22l2-7 2 7"/></svg>',
  duo: '<svg viewBox="0 0 24 24"><circle cx="8" cy="6" r="2.3"/><circle cx="16" cy="6" r="2.3"/><path d="M8 9v6M16 9v6M5 12h6M13 12h6M7 21l1-6 1 6M15 21l1-6 1 6"/></svg>',
  hist: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2v4M16 2v4M4 9h16M8 13h3M8 17h6"/></svg>',
  equip: '<svg viewBox="0 0 24 24"><path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/></svg>',
  set: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'
};

function navTab() {
  if (ui.view === 'yogaprev') return 'yoga';
  if (ui.view === 'yogaentry') return 'hist';
  if (ui.view === 'edit') { const e = entry(ui.editId); if (!e) return 'start'; return e.done ? 'hist' : e.duo ? 'duo' : 'start'; }
  return ui.view;
}
function render() {
  const tab = navTab();
  let html = '';
  if (ui.view === 'edit' && entry(ui.editId)) html = viewEditor(entry(ui.editId));
  else if (ui.view === 'duo') html = viewDuo();
  else if (ui.view === 'hist') html = viewHist();
  else if (ui.view === 'equip') html = viewEquip();
  else if (ui.view === 'set') html = viewSettings();
  else if (ui.view === 'yoga') html = viewYoga();
  else if (ui.view === 'yogaprev') html = viewYogaPreview();
  else if (ui.view === 'yogaentry' && entry(ui.editId)) html = viewYogaEntry(entry(ui.editId));
  else { ui.view = 'start'; html = viewStart(); }
  app.innerHTML = `<main>${html}</main>
    <nav class="tabs">
      ${[['start', 'Start'], ['duo', 'Duo'], ['yoga', 'Yoga'], ['hist', 'Verlauf'], ['equip', 'Geräte'], ['set', 'Sync']].map(([k, l]) =>
    `<button data-a="nav" data-v="${k}" class="${tab === k ? 'on' : ''} t-${k}">${ICONS[k]}${l}</button>`).join('')}
    </nav>
    ${ui.view === 'edit' && entry(ui.editId) && !FORMATS[entry(ui.editId).format].timed ? `<button class="fab" data-a="pause">⏱ Pause ${FORMATS[entry(ui.editId).format].pause} s</button>` : ''}`;
  if (ui.view === 'start') {
    const svg = $('svg.body', app);
    if (svg) {
      const sum = todaySummary(S);
      const g = Object.fromEntries(Object.entries(sum.zs).map(([z, s]) => [z, glow(s)]));
      const rec = new Set(sum.due.slice(0, 3).flatMap(d => PATTERNS[d.p].zones));
      paintBody(svg, g, rec, stretchedZones());
      if (ui.zone) svg.querySelectorAll(`.z[data-z="${ui.zone}"]`).forEach(p => p.classList.add('sel'));
    }
  }
  if (ui.sheet) renderSheet();
  paintSync();
}

function header(title, sub, right = '') {
  return `<div class="top"><div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div><div class="row">${right}<span class="syncdot"></span></div></div>`;
}

// ── Start ────────────────────────────────────────────────
function viewStart() {
  const sum = todaySummary(S);
  const d = draft(false);
  const last = sum.last;
  const today = new Date();
  let out = header('Workout <span>Diary</span>', `${WD[today.getDay()]}, ${today.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}`);
  if (d) out += `<div class="card"><div class="row"><div class="grow"><b>Training läuft</b><div class="dim">${FORMATS[d.format].n} · gestartet ${fmtTime(d.ts)}</div></div><button class="btn primary" data-a="open" data-id="${d.id}">Fortsetzen</button></div></div>`;
  out += `<div class="card bodywrap">${bodySVG()}
    <div class="legend"><span><i style="background:hsl(14 96% 50%)"></i>&lt; 24 h</span><span><i style="background:hsl(27 96% 54%)"></i>24–48 h</span><span><i style="background:hsl(33 80% 56%);opacity:.7"></i>48–72 h</span><span><i style="border:1.5px dashed var(--green)"></i>heute dran</span><span><i style="border:1.8px solid var(--blue)"></i>gedehnt</span></div>
    <div class="zinfo" id="zinfo">${ui.zone ? zoneInfo(ui.zone, sum) : 'Tippe auf einen Muskel für Details'}</div></div>`;
  out += `<div class="card"><h2>Zuletzt trainiert</h2>${last ? `
      <div class="row"><div class="grow"><b>${fmtDate(last.ts)}</b> <span class="muted">· ${agoText(last.ts)}</span><div class="dim">${FORMATS[last.format].n}${last.duo ? ' · mit Jenny' : ''}${last.mode === 'travel' ? ' · unterwegs' : ''}</div></div>
      <button class="btn sm" data-a="open" data-id="${last.id}">Ansehen</button></div>
      <div class="chips" style="margin-top:8px">${[...new Set(last.blocks.flatMap(b => b.items.map(i => EX[i.e?.ex]?.p)).filter(p => p && p !== 'iso' && p !== 'cardio'))].map(p => `<span class="chip small">${PATTERNS[p].n}</span>`).join('')}</div>`
    : '<div class="muted">Noch kein Training eingetragen. Leg los!</div>'}</div>`;
  out += `<div class="card"><h2>Was heute dran ist <span class="r dim">Woche: ${sum.week} / 2–3</span></h2>
    <div class="chips">${sum.due.slice(0, 4).map(x => `<span class="chip g">${PATTERNS[x.p].n}${x.d < 90 ? ` · ${Math.round(x.d)} T` : ''}</span>`).join('')}</div>
    ${sum.recovering.length ? `<div class="dim" style="margin-top:10px">Noch in Erholung (&lt; 48 h): ${sum.recovering.map(z => ZONES[z]).join(', ')}</div>` : ''}
    <div class="dim" style="margin-top:8px">Vorschlag: <b class="muted">${FORMATS[suggestFormat(S, Date.now(), S.settings.lastMode || 'home')].n}</b></div></div>`;
  out += `<div class="row" style="gap:10px;margin:14px 0">
      <button class="btn primary block" data-a="${d ? 'open' : 'new'}" ${d ? `data-id="${d.id}"` : ''}>${d ? 'Training fortsetzen' : '+ Neues Training'}</button></div>
    <button class="btn jenny block" data-a="nav" data-v="duo">Duo-Training mit Jenny</button>
    <div class="sp"></div><button class="btn yoga block" data-a="nav" data-v="yoga">🧘 Yoga &amp; Dehnen</button>`;
  return out;
}
function zoneInfo(z, sum) {
  const s = sum.zs[z];
  return `<b>${ZONES[z]}</b> · ${s.last ? `${agoText(s.last)} (${fmtDate(s.last)})${s.exs.length ? ' · ' + s.exs.join(', ') : ''}` : 'noch nicht trainiert'}`;
}

// ── Duo ──────────────────────────────────────────────────
function viewDuo() {
  const d = draft(true);
  if (d) { ui.view = 'edit'; ui.editId = d.id; return viewEditor(d); }
  const duos = doneEntries(S).filter(e => e.duo).slice(0, 5);
  return header('Duo-<span style="color:var(--jenny)">Training</span>', 'Eric & Jenny gemeinsam') +
    `<div class="card"><p class="muted" style="margin:0 0 10px">Ihr macht dieselben Übungen gleichzeitig – jede Person mit eigenem Gerät und eigenem Gewicht. Die App verteilt die Geräte so, dass ihr euch im selben Set nichts wegnehmt (z. B. Eric mit KB, Jenny mit Kurzhantel), und merkt sich Jennys Gewichte separat.</p>
    <p class="dim" style="margin:0">Partnerübungen wie Handtuch-Rudern, Handtuch-Latzug oder Nordic Curl werden bevorzugt.</p></div>
    <button class="btn jenny block" data-a="newduo">+ Duo-Training starten</button>
    <div class="sp"></div><button class="btn yoga block" data-a="duoyoga">🧘 Duo-Yoga mit Jenny</button>
    ${duos.length ? `<div class="week">Letzte Duo-Trainings</div>${duos.map(histCard).join('')}` : ''}`;
}

// ── Editor ───────────────────────────────────────────────
function viewEditor(e) {
  const F = FORMATS[e.format];
  const title = e.done ? `Training · ${fmtDate(e.ts)}` : e.duo ? 'Duo-Training' : 'Neues Training';
  let out = header(title, e.done ? `${F.n} · ${fmtTime(e.ts)}${e.end ? '–' + fmtTime(e.end) : ''}` : `gestartet ${fmtTime(e.ts)}`,
    `<button class="iconbtn" data-a="tipsall" title="Tipps">${ui.tips ? '💡' : '·'}</button>`);

  if (!e.done) {
    const sum = todaySummary(S);
    out += `<div class="card"><h2>Heute</h2>
      <div class="fmt">${Object.entries(FORMATS).filter(([k, f]) => !f.hidden).map(([k, f]) => `<button class="${e.format === k ? 'on' : ''}" data-a="fmt" data-v="${k}">${k === e.suggested ? '<span class="sug">Vorschlag</span>' : ''}<b>${f.n}</b><span>${f.long}</span></button>`).join('')}</div>
      <div class="sp"></div>
      <div class="seg"><button data-a="mode" data-v="home" class="${e.mode !== 'travel' ? 'on' : ''}">🏠 Zuhause</button><button data-a="mode" data-v="travel" class="${e.mode === 'travel' ? 'on' : ''}">🎒 Unterwegs</button></div>
      <div class="toggle" style="margin-top:8px"><span class="muted">Lauf heute oder morgen geplant</span><button class="sw ${e.runSoon ? 'on' : ''}" data-a="run"></button></div>
      ${sum.last ? `<div class="dim" style="margin-top:6px">Zuletzt: ${fmtDate(sum.last.ts)} (${agoText(sum.last.ts)}) · ${FORMATS[sum.last.format].n}</div>` : ''}
      ${e.warn ? `<div class="note warn">${esc(e.warn)}</div>` : ''}
      ${(e.notes || []).map(n => `<div class="note">${esc(n)}</div>`).join('')}
      <button class="btn sm ghost" data-a="regen" style="margin-top:8px">↻ Neu vorschlagen</button></div>`;
  }

  // Warm-up
  const w = e.warmup || { type: 'none' };
  out += `<div class="card"><h2>Warm-up</h2>
    <div class="chips">${[['rope', 'Seilspringen'], ['general', 'Kurzes Warm-up'], ['none', 'Bin schon warm']].map(([k, l]) => `<button class="chip ${w.type === k ? 'on' : ''}" data-a="warm" data-v="${k}">${l}</button>`).join('')}</div>
    ${w.type === 'rope' ? `<div class="row" style="margin-top:10px">${stepper('warmmin', `${w.min}<small>min</small>`)}<button class="btn sm" data-a="rope">▶ Timer</button></div>` : ''}
    ${w.type === 'general' ? `<ul class="plain">${WARMUP_GENERAL.map(x => `<li>${x}</li>`).join('')}</ul><div class="dim" style="margin-top:6px">Danach 1 Aufwärmsatz mit ca. 50 % bei der ersten schweren Übung.</div>` : ''}
  </div>`;

  // Sets
  e.blocks.forEach((b, bi) => out += renderBlock(e, b, bi));
  out += `<button class="btn ghost block" data-a="addblock">+ Set hinzufügen</button>`;

  // Stretching
  const st = e.stretch || { min: 8, list: [] };
  out += `<div class="card"><h2>Stretching</h2>
    <div class="row">${stepper('stretchmin', `${st.min}<small>min</small>`)}<button class="btn sm" data-a="stretchtimer">▶ Geführt</button><span class="dim grow" style="text-align:right">${st.list.length}/${STRETCHES.length}</span></div>
    <div style="margin-top:8px">${STRETCHES.map((x, i) => `<label class="check"><input type="checkbox" data-a="stretchck" data-i="${i}" ${st.list.includes(i) ? 'checked' : ''}>${stretchSVG(x.fig, 'thumb')}<span><b>${x.n}</b>${x.side ? ' <span class="dim">· pro Seite</span>' : ''}<br><span class="dim">${x.d.split('. ')[0]}.</span></span></label>`).join('')}</div></div>`;

  out += `<div class="card"><h2>Notiz</h2><textarea rows="2" data-a="note" placeholder="Wie lief's? (optional)">${esc(e.note)}</textarea></div>`;
  out += e.done
    ? `<button class="btn primary block" data-a="closeedit">Fertig</button><div class="sp"></div><button class="btn danger block" data-a="delete">Eintrag löschen</button>`
    : `<button class="btn primary block" data-a="save">✓ Training abschließen</button><div class="sp"></div><button class="btn danger block" data-a="discard">Verwerfen</button>`;
  return out + '<div style="height:40px"></div>';
}

function stepper(a, label, attrs = '', cls = '') {
  return `<span class="stepper ${cls}"><button data-a="${a}" data-d="-1" ${attrs}>−</button><span class="v">${label}</span><button data-a="${a}" data-d="1" ${attrs}>+</button></span>`;
}

function renderBlock(e, b, bi) {
  const F = FORMATS[e.format];
  const feas = blockFeasible(eqp(), b.items.flatMap(it => ['e', 'j'].map(w => it[w]).filter(Boolean).map(p => ({ v: p.v, w: p.w }))));
  const loaded = b.items.some(it => (it.e && isLoaded(it.e.v)) || (it.j && isLoaded(it.j.v)));
  let out = `<div class="block"><div class="bhead"><b>Set ${bi + 1}</b>
    ${stepper('rounds', `${b.rounds}<small>Runden</small>`, `data-bi="${bi}"`)}
    <span class="grow"></span>
    ${loaded ? `<span class="badge ${feas.ok ? 'ok' : 'warn'}">${feas.ok ? '✓ Scheiben' : '⚠ Umbau'}</span>` : ''}
    <button class="iconbtn" data-a="blockdel" data-bi="${bi}" title="Set löschen">✕</button></div>`;
  if (F.timed && e.hiit) {
    out += `<div class="bopt"><div class="ctrls">${stepper('hiitw', `${e.hiit.work}<small>s Arbeit</small>`)}${stepper('hiitr', `${e.hiit.rest}<small>s Pause</small>`)}${stepper('hiitrp', `${e.hiit.roundPause}<small>s zw. Runden</small>`)}</div>
      <button class="btn primary block" style="margin-top:10px" data-a="hiitstart" data-bi="${bi}">▶ Zirkel-Timer starten</button></div>`;
  }
  if (e.format === 'kb') {
    const opts = weightOptions(eqp(), 'kb');
    out += `<div class="bopt"><div class="row"><div class="grow"><b>KB-Gewicht für den ganzen Circuit</b><div class="dim">einarmig sauber machbar, zweiarmig nicht zu leicht</div></div>${stepper('kbw', `${num(b.kbWeight ?? opts[0])}<small>kg</small>`, `data-bi="${bi}"`, b.kbProg ? 'up' : '')}</div>
      ${b.kbProg ? `<div class="prog">↑ Steigerung: letztes Mal alle Wdh. geschafft mit ${num(b.kbProg.from)} kg</div>` : ''}
      <div class="plates">${plateText(eqp(), 'kb', b.kbWeight)}</div></div>`;
  }
  b.items.forEach((it, ii) => out += renderItem(e, b, bi, it, ii));
  out += `<div class="ex"><button class="btn sm ghost" data-a="addex" data-bi="${bi}" style="width:100%">+ Übung hinzufügen</button></div></div>`;
  return out;
}

function tipsHtml(ex, key) {
  const open = ui.more.has(key);
  const dos = open ? ex.do : ex.do.slice(0, 2);
  return `<div class="tips">${dos.map(t => `<div class="d">${esc(t)}</div>`).join('')}${ex.dont.map(t => `<div class="x">${esc(t)}</div>`).join('')}
    ${open && ex.easy ? `<div class="dim">Leichter: ${esc(ex.easy)} · Schwerer: ${esc(ex.hard || '–')}</div>` : ''}
    ${(ex.do.length > 2 || ex.easy) ? `<button class="more" data-a="more" data-k="${key}">${open ? 'weniger' : 'mehr …'}</button>` : ''}</div>`;
}
const infoBtn = id => `<button class="infobtn" data-a="info" data-id="${id}" title="Übung erklärt" aria-label="Übung erklärt">i</button>`;

function renderItem(e, b, bi, it, ii) {
  const ex = EX[it.e.ex];
  const key = `${e.id}-${bi}-${ii}`;
  let out = `<div class="ex"><div class="exhead"><span class="exnum">${bi + 1}.${ii + 1}</span><span class="pat">${PATTERNS[ex.p].n}${ex.side ? ' · pro Seite' : ''}${ex.partner ? ' · Partner' : ''}</span></div>
    <div class="exname"><button class="n" data-a="pick" data-bi="${bi}" data-ii="${ii}" data-who="e">${esc(ex.n)}${ex.star ? ' <span style="color:var(--ember2)">★</span>' : ''}</button>
    ${infoBtn(ex.id)}<button class="iconbtn" data-a="exdel" data-bi="${bi}" data-ii="${ii}" title="Entfernen">✕</button></div>`;
  if (!e.duo) {
    out += personCtrls(e, b, bi, ii, 'e', it.e);
    if (ui.tips) out += tipsHtml(ex, key);
    return out + '</div>';
  }
  const diff = it.j && it.j.ex !== it.e.ex;
  out += `<div class="pp e"><div class="pph">Eric</div>${personCtrls(e, b, bi, ii, 'e', it.e)}${ui.tips && diff ? tipsHtml(ex, key) : ''}</div>`;
  if (it.j) {
    const jx = EX[it.j.ex];
    out += `<div class="pp j"><div class="pph">Jenny${diff ? '' : ` <button class="swap" data-a="pick" data-bi="${bi}" data-ii="${ii}" data-who="j">andere Übung ▾</button>`}</div>
      ${diff ? `<div class="exname"><button class="n jn" data-a="pick" data-bi="${bi}" data-ii="${ii}" data-who="j">${esc(jx.n)}</button>${infoBtn(jx.id)}</div>` : ''}
      ${personCtrls(e, b, bi, ii, 'j', it.j)}
      ${ui.tips && diff ? tipsHtml(jx, key + '-j') : ''}</div>`;
  } else out += `<div class="pp j"><div class="pph">Jenny</div><button class="btn sm ghost" data-a="pick" data-bi="${bi}" data-ii="${ii}" data-who="j" style="width:100%">+ Übung für Jenny</button></div>`;
  if (ui.tips && !diff) out += tipsHtml(ex, key);
  return out + '</div>';
}

// ── Info-Sheet ───────────────────────────────────────────
function openInfo(id) {
  const ex = EX[id], d = DETAILS[id] || {};
  const prim = Object.keys(ex.m).filter(z => ex.m[z] >= 1), sec = Object.keys(ex.m).filter(z => ex.m[z] < 1);
  const vs = ex.v.map(v => VARIANTS[v].n + (v === 'bw' && ex.av ? ` (${AVAIL[ex.av]})` : '') + (variantPossible(eqp(), v) ? '' : ' (fehlt)'));
  const el = document.createElement('div');
  el.className = 'sheet-bg info'; el.dataset.a = 'infobg';
  el.innerHTML = `<div class="sheet"><div class="sh"><div class="grab"></div>
    <div class="row"><div class="grow"><div class="pat">${PATTERNS[ex.p].n}${ex.side ? ' · pro Seite' : ''}${ex.partner ? ' · Partnerübung' : ''}</div><b style="font-size:19px">${esc(ex.n)}${ex.star ? ' <span style="color:var(--ember2)">★</span>' : ''}</b></div><button class="iconbtn" data-a="infoclose">✕</button></div></div>
    <div class="sb">
      <div class="infobody">${bodySVG()}</div>
      <div class="chips" style="justify-content:center;margin:4px 0 10px">${prim.map(z => `<span class="chip small on">${ZONES[z]}</span>`).join('')}${sec.map(z => `<span class="chip small">${ZONES[z]}</span>`).join('')}</div>
      <div class="dim" style="text-align:center;margin-bottom:6px">Geräte: ${esc(vs.join(' · '))}</div>
      ${d.s ? `<h3>Ausgangsposition</h3><p>${esc(d.s)}</p>` : ''}
      ${d.x ? `<h3>Ablauf</h3><ol class="steps">${d.x.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
      <h3>Atmung</h3><p>${esc(d.b || DEFAULT_BREATH)}</p>
      ${d.f ? `<h3>Hier solltest du es spüren</h3><p>${esc(d.f)}</p>` : ''}
      <h3>Do's &amp; Don'ts</h3><div class="tips" style="font-size:14.5px">${ex.do.map(t => `<div class="d">${esc(t)}</div>`).join('')}${ex.dont.map(t => `<div class="x">${esc(t)}</div>`).join('')}</div>
      ${ex.easy || ex.hard ? `<h3>Anpassen</h3><p><b>Leichter:</b> ${esc(ex.easy || '–')}<br><b>Schwerer:</b> ${esc(ex.hard || '–')}</p>` : ''}
      <div style="height:16px"></div></div></div>`;
  document.body.appendChild(el);
  const g = {}; for (const [z, f] of Object.entries(ex.m)) g[z] = f >= 1 ? 1 : 0.45;
  paintBody($('svg.body', el), g);
}

function personCtrls(e, b, bi, ii, who, p) {
  const ex = EX[p.ex], F = FORMATS[e.format];
  const attrs = `data-bi="${bi}" data-ii="${ii}" data-who="${who}"`;
  const vs = ex.v.filter(v => variantPossible(eqp(), v) && (e.mode !== 'travel' || v === 'bw'));
  let out = '<div class="ctrls">';
  if (vs.length > 1) out += vs.map(v => `<button class="chip small ${p.v === v ? 'on' : ''}" data-a="var" data-v="${v}" ${attrs}>${VARIANTS[v].n}</button>`).join('');
  else out += `<span class="dim">${VARIANTS[p.v]?.n || ''}${ex.av && p.v === 'bw' ? ' · ' + AVAIL[ex.av] : ''}</span>`;
  out += '</div><div class="ctrls">';
  const kbFixed = e.format === 'kb' && who === 'e' && p.v === 'kb';
  if (isLoaded(p.v) && !kbFixed) {
    const lbl = p.v === 'kh2' ? 'kg je Hantel' : p.v === 'kb' ? 'kg KB' : 'kg Scheiben';
    out += stepper('w', `${num(p.w ?? 0)}<small>${lbl}</small>`, attrs, (p.prog ? 'up ' : '') + (who === 'j' ? 'j' : ''));
  } else if (kbFixed) out += `<span class="badge">${num(p.w)} kg KB</span>`;
  if (F.timed) out += `<span class="badge">${e.hiit.work} s</span>`;
  else if (p.reps != null) {
    const u = ex.u === 's' ? 's' : ex.u === 'm' ? 'm' : 'Wdh.';
    out += stepper('reps', `${p.reps}<small>${u}${ex.side ? '/Seite' : ''}</small>`, attrs, who === 'j' ? 'j' : '');
    if (ex.u === 's') out += `<button class="btn sm timebtn ${who === 'j' ? 'j' : ''}" data-a="extimer" ${attrs}>▶ ${p.reps} s${ex.side ? ' ×2' : ''}</button>`;
    out += `<button class="chip small ${p.rr ? 'on' : ''}" data-a="rr" ${attrs}>je Runde</button>`;
  }
  out += '</div>';
  if (p.rr && !F.timed) {
    out += `<div class="rr">${p.rr.map((r, ri) => `<div class="row"><span>Runde ${ri + 1}</span>${isLoaded(p.v) && !kbFixed ? stepper('rrw', `${num(r.w ?? 0)}<small>kg</small>`, attrs + ` data-ri="${ri}"`) : ''}${stepper('rrreps', `${r.reps}<small>${ex.u === 's' ? 's' : ex.u === 'm' ? 'm' : 'Wdh.'}</small>`, attrs + ` data-ri="${ri}"`)}</div>`).join('')}</div>`;
  }
  if (isLoaded(p.v) && p.w != null) { const pt = plateText(eqp(), p.v, p.w); if (pt) out += `<div class="plates">${pt}</div>`; }
  if (p.prog) out += `<div class="prog">↑ Steigerung: letztes Mal ${p.prog.last.length}× ${Math.min(...p.prog.last)}+ mit ${num(p.prog.from)} kg geschafft</div>`;
  const lp = lastPerf(S, who, p.ex, p.v, e.id);
  if (lp) out += `<div class="lastp">Letztes Mal (${fmtDate(lp.ts)}): ${lp.w != null && isLoaded(lp.v) ? num(lp.w) + ' kg · ' : ''}${lp.rr?.length ? lp.rr.map(r => r.reps).join(' / ') : (lp.reps != null ? lp.rounds + '× ' + lp.reps : FORMATS[lp.format]?.timed ? 'HIIT' : '')}</div>`;
  return out;
}

// ── Übungsauswahl (Sheet) ─────────────────────────────────
function openPicker(bi, ii, who) {
  const e = entry(ui.editId);
  let grp = 'recent';
  if (ii != null) { const cur = e.blocks[bi].items[ii]?.[who] || e.blocks[bi].items[ii]?.e; if (cur) grp = 'p:' + EX[cur.ex].p; }
  if (!recentList(who).length && grp === 'recent') grp = 'all';
  ui.sheet = { bi, ii, who, grp, q: '' };
  render();
}
function recentList(who) {
  const out = [];
  for (const en of doneEntries(S)) for (const b of en.blocks) for (const it of b.items) { const p = it[who]; if (p && !out.includes(p.ex)) out.push(p.ex); }
  return out.slice(0, 12);
}
function sheetList(e, sh) {
  const okEx = ex => ex.v.some(v => variantPossible(eqp(), v) && (e.mode !== 'travel' || (v === 'bw' && ['u', 'm', 't'].includes(ex.av))));
  let list = EXERCISES.filter(okEx);
  if (sh.q) { const q = sh.q.toLowerCase(); return [['Suche', list.filter(x => x.n.toLowerCase().includes(q) || Object.keys(x.m).some(z => ZONES[z].toLowerCase().includes(q)))]]; }
  if (sh.grp === 'recent') return [['Zuletzt verwendet', recentList(sh.who).map(id => EX[id]).filter(x => x && okEx(x))]];
  if (sh.grp.startsWith('p:')) { const p = sh.grp.slice(2); return [[PATTERNS[p].n, list.filter(x => x.p === p)]]; }
  if (sh.grp.startsWith('r:')) { const r = sh.grp.slice(2); return [[REGIONS[r], list.filter(x => x.r.includes(r))]]; }
  return Object.entries(REGIONS).map(([r, n]) => [n, list.filter(x => x.r[0] === r)]);
}
function renderSheet() {
  const e = entry(ui.editId); if (!e) { ui.sheet = null; return; }
  const sh = ui.sheet;
  let el = $('.sheet-bg');
  const fresh = !el;
  if (fresh) { el = document.createElement('div'); el.className = 'sheet-bg'; el.dataset.a = 'sheetbg'; document.body.appendChild(el); }
  const groups = sheetList(e, sh);
  const chips = [['recent', 'Zuletzt'], ...Object.entries(REGIONS).map(([k, n]) => ['r:' + k, n]), ['all', 'Alle']];
  const body = groups.map(([n, xs]) => `<div class="grp">${n}</div>${xs.length ? xs.map(x => `<div class="pickrow"><button class="pick" data-a="pickx" data-id="${x.id}"><span><b>${esc(x.n)}</b>${x.star ? ' <span style="color:var(--ember2)">★</span>' : ''}<br><span class="m">${Object.keys(x.m).filter(z => x.m[z] >= 1).map(z => ZONES[z]).join(', ')}</span></span><span class="ic">${x.v.filter(v => variantPossible(eqp(), v)).map(v => VARIANTS[v].n === 'ohne Gerät' ? 'KG' : v.toUpperCase().replace('KH1', 'KH').replace('KH2', '2KH')).join(' · ')}</span></button>${infoBtn(x.id)}</div>`).join('') : '<div class="dim" style="padding:10px 0">Noch nichts hier.</div>'}`).join('');
  if (fresh) {
    el.innerHTML = `<div class="sheet"><div class="sh"><div class="grab"></div>
      <div class="row"><b class="grow">${sh.who === 'j' ? 'Übung für Jenny' : sh.ii == null ? 'Übung hinzufügen' : 'Übung wählen'}</b><button class="iconbtn" data-a="sheetclose">✕</button></div>
      <input id="sq" type="search" placeholder="Suchen (Übung oder Muskel) …" style="margin-top:8px" value="${esc(sh.q)}">
      <div class="chips scroll" id="sgrp" style="margin-top:8px"></div></div><div class="sb" id="sbody"></div></div>`;
    $('#sq', el).addEventListener('input', ev => { sh.q = ev.target.value; renderSheet(); });
  }
  $('#sgrp', el).innerHTML = chips.map(([k, n]) => `<button class="chip small ${sh.grp === k && !sh.q ? 'on' : ''}" data-a="pgrp" data-v="${k}">${n}</button>`).join('');
  $('#sbody', el).innerHTML = body;
}
function closeSheet() { ui.sheet = null; $('.sheet-bg')?.remove(); }

function chooseVariant(e, ex, who, avoid) {
  const ok = v => ex.v.includes(v) && variantPossible(eqp(), v) && (e.mode !== 'travel' || v === 'bw');
  if (e.format === 'kb' && who === 'e' && ok('kb')) return 'kb';
  const lv = lastVariant(S, who, ex.id);
  if (lv && ok(lv) && lv !== avoid) return lv;
  return ex.v.find(v => ok(v) && v !== avoid) || ex.v.find(ok) || 'bw';
}
function applyPick(id) {
  const e = entry(ui.editId), sh = ui.sheet, ex = EX[id];
  const b = e.blocks[sh.bi];
  const single = v => ['kb', 'sz', 'bar', 'bank'].includes(v);
  if (sh.ii == null) {
    const it = { pat: ex.p, e: makePerson(S, eqp(), 'e', ex, chooseVariant(e, ex, 'e'), e.format) };
    if (e.format === 'kb' && it.e.v === 'kb') it.e.w = b.kbWeight;
    if (e.duo) { const v = chooseVariant(e, ex, 'j', single(it.e.v) ? it.e.v : null); it.j = makePerson(S, eqp(), 'j', ex, v, e.format, it.e); }
    b.items.push(it);
  } else {
    const it = b.items[sh.ii];
    if (sh.who === 'e') {
      const sameJ = it.j && it.j.ex === it.e.ex;
      it.e = makePerson(S, eqp(), 'e', ex, chooseVariant(e, ex, 'e'), e.format); it.pat = ex.p;
      if (e.format === 'kb' && it.e.v === 'kb') it.e.w = b.kbWeight;
      if (e.duo && (sameJ || !it.j)) { const v = chooseVariant(e, ex, 'j', single(it.e.v) ? it.e.v : null); it.j = makePerson(S, eqp(), 'j', ex, v, e.format, it.e); }
    } else {
      it.j = makePerson(S, eqp(), 'j', ex, chooseVariant(e, ex, 'j', single(it.e.v) && it.e.ex === id ? it.e.v : null), e.format, it.e);
    }
  }
  closeSheet(); touch(e); render();
}

// ── Verlauf ──────────────────────────────────────────────
function histCard(e) {
  if (e.format === 'yoga') {
    const y = e.yoga || {};
    return `<button class="hist ycard" data-a="open" data-id="${e.id}"><div class="t"><span>${fmtDate(e.ts)} · 🧘 ${esc(y.name || 'Yoga')}</span><span class="dim">${e.duo ? '<span style="color:var(--jenny)">Duo</span> · ' : ''}${e.mode === 'travel' ? '🎒 · ' : ''}${Math.round((y.sec || 0) / 60)} min</span></div>
      <div class="s">${(y.poses || []).length} Positionen · ${esc([...new Set((y.poses || []).map(id => POSE[id]?.n).filter(Boolean))].slice(0, 4).join(', '))}</div></button>`;
  }
  const exs = e.blocks.flatMap(b => b.items.map(i => EX[i.e?.ex]?.n)).filter(Boolean);
  const dur = e.end ? Math.round((e.end - e.ts) / 60000) : null;
  return `<button class="hist" data-a="open" data-id="${e.id}"><div class="t"><span>${fmtDate(e.ts)} · ${FORMATS[e.format].n}</span><span class="dim">${e.duo ? '<span style="color:var(--jenny)">Duo</span> · ' : ''}${e.mode === 'travel' ? '🎒 · ' : ''}${dur ? dur + ' min' : ''}</span></div>
    <div class="s">${exs.length} Übungen · ${esc(exs.slice(0, 4).join(', '))}${exs.length > 4 ? ' …' : ''}</div></button>`;
}
function isoWeek(ts) {
  const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return d.getFullYear() + '-KW' + String(1 + Math.round(((d - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7)).padStart(2, '0');
}
function viewHist() {
  const done = doneEntries(S);
  let out = header('Verlauf', `${done.length} Trainings`);
  if (!done.length) return out + '<div class="empty">Noch keine Einträge.</div>';
  // Letzte Werte je Übung
  const who = ui.histWho;
  const seen = new Map();
  for (const en of done) for (const b of en.blocks) for (const it of b.items) { const p = it[who]; if (p && !seen.has(p.ex + p.v)) seen.set(p.ex + p.v, { p, ts: en.ts, rounds: p.rr?.length || b.rounds, timed: FORMATS[en.format].timed }); }
  const hasJ = done.some(e => e.duo && e.format !== 'yoga');
  if (seen.size) out += `<div class="card"><h2>Letzte Werte ${hasJ ? `<span class="r"><span class="seg" style="display:inline-flex;padding:2px"><button data-a="hwho" data-v="e" class="${who === 'e' ? 'on' : ''}" style="padding:4px 10px">Eric</button><button data-a="hwho" data-v="j" class="${who === 'j' ? 'on' : ''}" style="padding:4px 10px">Jenny</button></span></span>` : ''}</h2>
    <table class="t">${[...seen.values()].sort((a, b) => EX[a.p.ex].n.localeCompare(EX[b.p.ex].n)).map(({ p, ts, rounds, timed }) => `<tr><td>${esc(EX[p.ex].n)}<br><span class="dim">${VARIANTS[p.v].n} · ${fmtDate(ts)}</span></td><td>${isLoaded(p.v) && p.w != null ? '<b>' + num(p.w) + ' kg</b><br>' : ''}${timed ? 'HIIT' : p.rr?.length ? p.rr.map(r => r.reps).join('/') : rounds + '×' + (p.reps ?? '')}</td></tr>`).join('')}</table></div>`;
  let wk = '';
  for (const e of done) { const w = isoWeek(e.ts); if (w !== wk) { wk = w; out += `<div class="week">${w.replace('-', ' · ')}</div>`; } out += histCard(e); }
  return out;
}

// ── Equipment ────────────────────────────────────────────
function viewEquip() {
  const eq = eqp();
  const types = [...new Set(eq.plates.map(p => p.type))];
  let out = header('Equipment', 'Änderungen wirken sofort auf alle Vorschläge');
  out += `<div class="card"><h2>Geräte</h2>${eq.implements.map((im, i) => `
    <div class="eq"><div class="row"><input value="${esc(im.n)}" data-eq="im" data-i="${i}" data-f="n" style="font-weight:650"><button class="sw ${im.on !== false ? 'on' : ''}" data-a="eqon" data-i="${i}" title="verfügbar"></button></div>
      <div class="grid">
        <label>Typ<select data-eq="im" data-i="${i}" data-f="type">${Object.entries(IMPL_TYPES).map(([k, n]) => `<option value="${k}" ${im.type === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label>Anzahl<input type="number" inputmode="numeric" min="0" value="${im.count ?? 1}" data-eq="im" data-i="${i}" data-f="count"></label>
        ${['kh', 'sz', 'kb'].includes(im.type) ? `<label>Eigengewicht (kg)<input type="number" inputmode="decimal" step="0.25" value="${im.base ?? 0}" data-eq="im" data-i="${i}" data-f="base"></label>
        <label>Max. Zuladung (kg)<input type="number" inputmode="decimal" step="0.25" value="${im.maxLoad ?? ''}" placeholder="unbegrenzt" data-eq="im" data-i="${i}" data-f="maxLoad"></label>` : ''}
      </div>
      ${['kh', 'sz', 'kb'].includes(im.type) ? `<div class="chips" style="margin-top:8px"><span class="dim" style="align-self:center">Nimmt:</span>${types.map(t => `<button class="chip small ${(im.accepts || []).includes(t) ? 'on' : ''}" data-a="eqacc" data-i="${i}" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
      ${im.on === false ? `<div class="dim" style="margin-top:6px">nicht verfügbar${im.note ? ' · ' + esc(im.note) : ''}</div>` : ''}
      <button class="btn sm danger" data-a="eqdel" data-i="${i}" style="margin-top:8px">Entfernen</button></div>`).join('')}
    <button class="btn sm ghost" data-a="eqadd" style="width:100%;margin-top:8px">+ Gerät</button></div>`;
  out += `<div class="card"><h2>Scheiben <span class="r dim">gesamt ${fmtKg(eq.plates.reduce((s, p) => s + p.w * p.count, 0))}</span></h2>
    ${eq.plates.map((p, i) => `<div class="row" style="margin:6px 0"><label class="grow dim">Gewicht<input type="number" inputmode="decimal" step="0.25" value="${p.w}" data-eq="pl" data-i="${i}" data-f="w"></label>
      <label class="grow dim">Typ<input value="${esc(p.type)}" data-eq="pl" data-i="${i}" data-f="type"></label>
      <label class="grow dim">Anzahl<input type="number" inputmode="numeric" min="0" value="${p.count}" data-eq="pl" data-i="${i}" data-f="count"></label>
      <button class="iconbtn" data-a="pldel" data-i="${i}" style="margin-top:16px">✕</button></div>`).join('')}
    <button class="btn sm ghost" data-a="pladd" style="width:100%;margin-top:6px">+ Scheibe</button>
    <div class="dim" style="margin-top:8px">„Typ“ beschreibt, auf welche Geräte die Scheibe passt (Lochgröße). Bei den Geräten oben stellst du ein, welche Typen sie nehmen.</div></div>`;
  out += `<div class="card"><h2>Machbare Gewichte</h2>${['kh1', 'kh2', 'sz', 'kb'].filter(v => variantPossible(eq, v)).map(v => {
    const o = weightOptions(eq, v);
    return `<div style="margin:6px 0"><b>${VARIANTS[v].n}</b> <span class="dim">${v === 'kb' ? '(Gesamtgewicht)' : v === 'kh2' ? '(Scheiben je Hantel)' : '(nur Scheiben)'}</span><div class="opts">${o.map(num).join(' · ')} kg</div></div>`;
  }).join('')}
  <button class="btn sm ghost" data-a="eqreset" style="margin-top:8px">Auf Kompendium-Stand zurücksetzen</button></div>`;
  return out;
}

// ── Einstellungen / Sync ─────────────────────────────────
function viewSettings() {
  const c = syncCfg();
  return header('Sync & Daten', '') + `
  <div class="card"><h2>GitHub-Sync <span class="r dim" id="syncmsg">${esc(ui.syncMsg)}</span></h2>
    <div class="dim" style="margin-bottom:10px">Die Trainingsdaten landen als <code>${esc(c.path)}</code> in einem eigenen (privaten) Repo. Der Token bleibt nur auf diesem Gerät gespeichert.</div>
    <div class="eq" style="border:0;padding-top:0"><div class="grid">
      <label>Benutzer<input data-cfg="owner" value="${esc(c.owner)}" autocapitalize="off"></label>
      <label>Daten-Repo<input data-cfg="repo" value="${esc(c.repo)}" autocapitalize="off"></label>
      <label>Datei<input data-cfg="path" value="${esc(c.path)}" autocapitalize="off"></label>
      <label>Branch<input data-cfg="branch" value="${esc(c.branch)}" autocapitalize="off"></label></div>
      <label style="margin-top:8px">Token (fine-grained, „Contents: Read and write“)<input data-cfg="token" type="password" value="${esc(c.token)}" autocomplete="off" placeholder="github_pat_…"></label></div>
    <button class="btn primary block" data-a="syncnow" style="margin-top:10px">Jetzt synchronisieren</button>
    <details style="margin-top:12px"><summary class="muted">So richtest du es ein</summary><ol class="plain">
      <li>Auf GitHub ein neues <b>privates</b> Repo <code>workout-diary-data</code> anlegen (mit README).</li>
      <li>Settings → Developer settings → Personal access tokens → <b>Fine-grained tokens</b> → Generate.</li>
      <li>Repository access: <i>Only select repositories</i> → <code>workout-diary-data</code>.</li>
      <li>Permissions → Repository → <b>Contents: Read and write</b>. Ablaufdatum nach Wunsch.</li>
      <li>Token hier einfügen und „Jetzt synchronisieren“ tippen.</li></ol></details></div>
  <div class="card"><h2>Standardwerte</h2>
    <div class="row" style="justify-content:space-between"><span class="muted">Seilspringen</span>${stepper('defrope', `${S.settings.rope}<small>min</small>`)}</div><div class="sp"></div>
    <div class="row" style="justify-content:space-between"><span class="muted">Stretching</span>${stepper('defstretch', `${S.settings.stretch}<small>min</small>`)}</div></div>
  <div class="card"><h2>Backup</h2><div class="row"><button class="btn sm grow" data-a="export">Exportieren (JSON)</button><button class="btn sm grow" data-a="import">Importieren</button></div>
    <div class="dim" style="margin-top:8px">${S.entries.filter(e => e.done && !e.deleted).length} Trainings gespeichert.</div></div>
  <div class="dim" style="text-align:center;margin:20px 0">Workout Diary · Übungen &amp; Logik nach deinem Trainings-Kompendium</div>`;
}

// ── Yoga & Dehnen ────────────────────────────────────────
const DURS = [5, 10, 15, 20, 30];
const yDur = () => S.settings.yogaDur || 10;
const yTts = () => S.settings.yogaTts !== false;
const WALL = new Set(['wade_wand', 'soleus', 'ball_ruecken', 'beine_wand']);
const CHAIRP = new Set(['stuhl_katze', 'stuhl_drehung', 'stuhl_taube', 'stuhl_vorbeuge', 'stuhl_seit', 'fussgelenk', 'hamstring_st']);

// Muskelzonen, die in den letzten 24 h gedehnt wurden (Yoga + Stretching nach dem Training)
function stretchedZones(now = Date.now()) {
  const z = new Set();
  for (const e of doneEntries(S)) {
    if (now - e.ts > 24 * 3600e3) break;
    if (e.format === 'yoga') (e.yoga?.poses || []).forEach(id => (POSE[id]?.tags || []).forEach(t => TAG_ZONES[t]?.forEach(x => z.add(x))));
    else (e.stretch?.list || []).forEach(i => (STRETCHES[i]?.z || []).forEach(x => z.add(x)));
  }
  return z;
}
function lastStretchByTag() {
  const r = {};
  for (const e of doneEntries(S)) {
    const tags = e.format === 'yoga' ? (e.yoga?.poses || []).flatMap(id => POSE[id]?.tags || []) : [];
    for (const t of tags) if (!r[t]) r[t] = e.ts;
  }
  return r;
}
function yogaSuggestion(now = new Date()) {
  const h = now.getHours();
  if (h < 11) return { id: 'wecken', why: 'Guten Morgen – sanft wach werden.' };
  if (h >= 20) return { id: 'abend', why: 'Später Abend – zum Runterkommen.' };
  const lastStrength = doneEntries(S).find(e => e.format !== 'yoga');
  if (lastStrength && Date.now() - lastStrength.ts < 3 * 3600e3) {
    const legs = lastStrength.blocks.some(b => b.items.some(it => ['knee', 'hip'].includes(EX[it.e?.ex]?.p)));
    return { id: legs ? 'sitzen_matte' : 'nacken', why: 'Ergänzung zu deinem Training von heute.' };
  }
  const ls = lastStretchByTag();
  const cands = PROGRAMS.filter(p => !p.travel && !['wecken', 'abend'].includes(p.id)).map(p => {
    const tags = [...new Set(p.items.flatMap(([id]) => POSE[id].tags))];
    const age = Math.min(...tags.map(t => ls[t] ? (Date.now() - ls[t]) / 864e5 : 30));
    return { p, age };
  }).sort((a, b) => b.age - a.age);
  return { id: cands[0].p.id, why: 'Diese Bereiche hast du am längsten nicht gedehnt.' };
}

function currentYoga() {
  const y = ui.y, min = yDur();
  if (y.prog === 'custom') {
    let items = buildCustom({ ...y.custom, duo: y.duo });
    if (y.duo) items = withPartner(items, min, y.custom.place === 'm' ? 'm' : 'travel');
    const plan = planSession(items, min);
    const fn = y.custom.focus.length ? y.custom.focus.map(f => FOCUS[f].n).join(', ') : 'Ganzkörper';
    return { id: 'custom', name: `Eigenes Set: ${fn}`, style: y.custom.style, travel: y.custom.place !== 'm', plan, min };
  }
  const prog = PROGRAM[y.prog];
  const items = programItems(prog, { travel: y.travel, duo: y.duo, minutes: min });
  return { id: prog.id, name: prog.n, style: prog.style, travel: !!prog.travel || y.travel, plan: planSession(items, min), min };
}
function holdText(it) {
  const p = POSE[it.id];
  if (p.flow) return `${it.rounds} ${it.rounds === 1 ? 'Runde' : 'Runden'}`;
  return p.side ? `2 × ${it.hold} s` : (it.hold >= 60 ? `${Math.floor(it.hold / 60)}:${String(it.hold % 60).padStart(2, '0')} min` : `${it.hold} s`);
}
function needs(plan, travel) {
  const ids = new Set(plan.map(x => x.id));
  const n = [];
  if (!travel && [...ids].some(id => POSE[id].place.includes('m'))) n.push('Matte');
  if ([...ids].some(id => WALL.has(id))) n.push('Wand');
  if ([...ids].some(id => id === 'tuer_brust')) n.push('Türrahmen');
  if ([...ids].some(id => CHAIRP.has(id))) n.push('Stuhl');
  [...new Set([...ids].map(id => POSE[id].prop).filter(Boolean))].forEach(x => n.push(x));
  if (ui.y.duo) n.push('Jenny 💜');
  return n;
}

function viewYoga() {
  const y = ui.y, sug = yogaSuggestion(), sp = PROGRAM[sug.id];
  const durChips = `<div class="chips">${DURS.map(d => `<button class="chip ${yDur() === d ? 'on' : ''}" data-a="ydur" data-v="${d}">${d} min</button>`).join('')}</div>`;
  let out = header('Yoga &amp; <span style="color:var(--teal)">Dehnen</span>', 'Einsteigerfreundlich · mit Bildern und Ansage');
  out += `<div class="card"><h2>Vorschlag</h2><button class="prog-card" data-a="yprog" data-id="${sp.id}"><span class="pi">${sp.icon}</span><span class="grow"><b>${sp.n}</b><br><span class="dim">${sug.why}</span></span><span class="go">›</span></button></div>`;
  out += `<div class="card"><h2>Einstellungen</h2>${durChips}<div class="sp"></div>
    <div class="seg"><button data-a="ytravel" data-v="0" class="${!y.travel ? 'on' : ''}">🧘 Mit Matte</button><button data-a="ytravel" data-v="1" class="${y.travel ? 'on' : ''}">🎒 Unterwegs</button></div>
    <div class="toggle" style="margin-top:8px"><span class="muted">Zu zweit mit Jenny</span><button class="sw ${y.duo ? 'on' : ''}" data-a="yduo"></button></div>
    <div class="toggle"><span class="muted">Sprachansage</span><button class="sw ${yTts() ? 'on' : ''}" data-a="ytts"></button></div>
    ${y.travel ? '<div class="dim" style="margin-top:4px">Unterwegs werden Matten-Übungen durch Varianten im Stehen oder Sitzen ersetzt.</div>' : ''}</div>`;
  for (const th of THEMES) {
    const ps = PROGRAMS.filter(p => p.theme === th.id);
    out += `<div class="week">${th.n}</div>` + ps.map(p => `<button class="prog-card card" data-a="yprog" data-id="${p.id}"><span class="pi">${p.icon}</span><span class="grow"><b>${p.n}</b> <span class="badge">${p.style}</span>${p.travel ? ' <span class="badge">ohne Matte</span>' : ''}<br><span class="dim">${p.desc}</span></span><span class="go">›</span></button>`).join('');
  }
  const c = y.custom;
  out += `<div class="week">Eigenes Set</div><div class="card"><h2>Baukasten</h2>
    <div class="dim" style="margin-bottom:6px">Fokus (mehrere möglich)</div>
    <div class="chips">${Object.entries(FOCUS).map(([k, f]) => `<button class="chip small ${c.focus.includes(k) ? 'on' : ''}" data-a="yfocus" data-v="${k}">${f.n}</button>`).join('')}</div>
    <div class="sp"></div><div class="seg"><button data-a="ystyle" data-v="ruhig" class="${c.style === 'ruhig' ? 'on' : ''}">Ruhig halten</button><button data-a="ystyle" data-v="fließend" class="${c.style === 'fließend' ? 'on' : ''}">Fließend</button></div>
    <div class="sp"></div><div class="seg">${[['m', 'Matte'], ['st', 'Stehen'], ['si', 'Sitzen']].map(([k, l]) => `<button data-a="yplace" data-v="${k}" class="${c.place === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    <button class="btn yoga block" style="margin-top:12px" data-a="yprog" data-id="custom">Zusammenstellen</button></div>`;
  const recent = doneEntries(S).filter(e => e.format === 'yoga').slice(0, 4);
  if (recent.length) out += `<div class="week">Zuletzt</div>${recent.map(histCard).join('')}`;
  return out;
}

function viewYogaPreview() {
  const s = currentYoga();
  const total = planSeconds(s.plan);
  const nd = needs(s.plan, s.travel);
  let out = header(esc(s.name), `${Math.round(total / 60)} min · ${s.style} · ${s.plan.length} Positionen${ui.y.duo ? ' · zu zweit' : ''}`, `<button class="iconbtn" data-a="nav" data-v="yoga">‹</button>`);
  out += `<div class="chips" style="margin:4px 0 8px">${DURS.map(d => `<button class="chip ${yDur() === d ? 'on' : ''}" data-a="ydur" data-v="${d}">${d} min</button>`).join('')}</div>`;
  if (nd.length) out += `<div class="note">Du brauchst: ${nd.join(' · ')}</div>`;
  out += `<div class="card ylist">${s.plan.map((it, i) => {
    const p = POSE[it.id];
    return `<div class="yrow">${poseSVG(p, 'thumb')}<div class="grow"><b>${i + 1}. ${esc(p.n)}</b>${it.rep ? ' <span class="dim">· 2. Runde</span>' : ''}${p.partner ? ' <span class="badge" style="color:var(--jenny)">zu zweit</span>' : ''}<br><span class="dim">${holdText(it)}${p.side ? ' · pro Seite' : ''}${p.dyn ? ' · in Bewegung' : ''}</span></div>${infoBtnY(p.id)}</div>`;
  }).join('')}</div>`;
  out += `<button class="btn yoga block" data-a="ystart">▶ Start (${Math.round(total / 60)} min)</button>
    <div class="dim" style="text-align:center;margin-top:8px">Sprachansage ${yTts() ? 'an' : 'aus'} · Bildschirm bleibt an</div><div style="height:30px"></div>`;
  return out;
}
const infoBtnY = id => `<button class="infobtn" data-a="yinfo" data-id="${id}" title="Erklärung">i</button>`;

function viewYogaEntry(e) {
  const y = e.yoga || {};
  let out = header(`🧘 ${esc(y.name || 'Yoga')}`, `${fmtDate(e.ts)} · ${fmtTime(e.ts)} · ${Math.round((y.sec || 0) / 60)} min${e.duo ? ' · mit Jenny' : ''}`, `<button class="iconbtn" data-a="nav" data-v="hist">‹</button>`);
  out += `<div class="card ylist">${[...new Set(y.poses || [])].filter(id => POSE[id]).map(id => `<div class="yrow">${poseSVG(POSE[id], 'thumb')}<div class="grow"><b>${esc(POSE[id].n)}</b><br><span class="dim">${POSE[id].tags.map(t => TAGS[t]).join(', ')}</span></div>${infoBtnY(id)}</div>`).join('')}</div>`;
  if (y.prog) out += `<button class="btn yoga block" data-a="yagain">Nochmal machen</button><div class="sp"></div>`;
  out += `<button class="btn danger block" data-a="ydel">Eintrag löschen</button>`;
  return out;
}

function openPoseInfo(id) {
  const p = POSE[id];
  const el = document.createElement('div');
  el.className = 'sheet-bg info'; el.dataset.a = 'infobg';
  el.innerHTML = `<div class="sheet"><div class="sh"><div class="grab"></div>
    <div class="row"><div class="grow"><div class="pat">${p.place.map(x => PLACES[x]).join(' / ')}${p.side ? ' · pro Seite' : ''}${p.partner ? ' · zu zweit' : ''}</div><b style="font-size:19px">${esc(p.n)}</b></div><button class="iconbtn" data-a="infoclose">✕</button></div></div>
    <div class="sb"><div class="yinfo-fig">${poseSVG(p)}</div>
      <div class="chips" style="justify-content:center;margin:4px 0 10px">${p.tags.map(t => `<span class="chip small on">${TAGS[t]}</span>`).join('')}</div>
      <h3>So geht's</h3><p>${esc(p.d)}</p>
      ${p.easy ? `<h3>Für Einsteiger</h3><p>${esc(p.easy)}</p>` : ''}
      ${p.prop ? `<h3>Hilfsmittel</h3><p>${esc(p.prop)}</p>` : ''}
      ${p.steps ? `<h3>Ablauf</h3><ol class="steps">${p.steps.map(([sid, t, b]) => `<li>${esc(t)} <span class="dim">(${POSE[sid].n})</span></li>`).join('')}</ol>` : ''}
      <div style="height:16px"></div></div></div>`;
  document.body.appendChild(el);
}

function yogaPhases(s) {
  const ph = [];
  const first = POSE[s.plan[0].id];
  ph.push({ label: 'Gleich geht’s los', what: first.n, desc: first.d, img: poseSVG(first.flow ? POSE[first.steps[0][0]] : first, 'big'), sec: 8, kind: 'plain', say: `${s.name}. Los geht's mit: ${first.n}.` });
  s.plan.forEach((it, k) => {
    const p = POSE[it.id], nx = s.plan[k + 1] ? POSE[s.plan[k + 1].id] : null;
    const base = { what: p.n, kind: 'yoga', next: nx ? nx.n : 'Fertig' };
    if (p.flow) {
      for (let r = 0; r < it.rounds; r++) p.steps.forEach(([sid, txt, b], j) => {
        const sp = POSE[sid];
        ph.push({ ...base, label: `${p.n} · Runde ${r + 1}/${it.rounds}`, desc: txt, img: poseSVG(sp, 'big'), sec: b * BREATH, quiet: true, say: j === 0 && r === 0 ? `${p.n}. ${txt}` : txt });
      });
    } else if (p.side) {
      ph.push({ ...base, label: `${p.n} · erste Seite`, desc: p.d, img: poseSVG(p, 'big'), sec: it.hold, say: `${p.n}. ${p.cue}` });
      ph.push({ ...base, label: 'Seite wechseln', desc: 'Langsam lösen und zur anderen Seite wechseln.', img: poseSVG(p, 'big flip'), sec: SWITCH, kind: 'plain', quiet: true, say: 'Seite wechseln.' });
      ph.push({ ...base, label: `${p.n} · zweite Seite`, desc: p.d, img: poseSVG(p, 'big flip'), sec: it.hold, say: 'Andere Seite.' });
    } else {
      ph.push({ ...base, label: p.n + (it.rep ? ' · 2. Runde' : ''), desc: p.d, img: poseSVG(p, 'big'), sec: it.hold, say: `${p.n}. ${p.cue}` });
    }
    if (nx) {
      const nimg = nx.flow ? POSE[nx.steps[0][0]] : nx;
      ph.push({ label: 'Nächste Position', what: nx.n, desc: nx.easy ? 'Tipp: ' + nx.easy : '', img: poseSVG(nimg, 'big'), sec: TRANS, kind: 'plain', quiet: true, say: `Als Nächstes: ${nx.n}.` });
    }
  });
  return ph;
}

function startYoga() {
  const s = currentYoga();
  const ph = yogaPhases(s);
  const start = Date.now();
  const tts = yTts();
  if (tts) speak(ph[0].say); // im Klick starten (iOS)
  runTimer(ph, {
    title: '🧘', soft: true,
    onPhase: (p, i) => { if (tts && i > 0) speak(p.say); },
    onDone: (completed, elapsed) => {
      if (tts) { if (completed) speak('Fertig. Schön gemacht.'); else stopSpeak(); }
      if (elapsed < 60) { toast('Nicht gespeichert (unter 1 Minute)'); return; }
      const poses = s.plan.map(x => x.id);
      S.entries.unshift({ id: uid(), ts: start, end: Date.now(), updatedAt: Date.now(), done: true, format: 'yoga', duo: ui.y.duo, mode: s.travel ? 'travel' : 'home', blocks: [],
        yoga: { prog: s.id, name: s.name, min: s.min, sec: elapsed, poses, custom: s.id === 'custom' ? { ...ui.y.custom } : undefined } });
      persist(); toast(completed ? 'Yoga eingetragen 🧘' : 'Teilweise eingetragen'); ui.view = 'yoga'; render(); scrollTo(0, 0);
    }
  });
}

// ── Events ───────────────────────────────────────────────
function P(el) { const d = el.dataset; return { bi: +d.bi, ii: +d.ii, who: d.who, ri: +d.ri, dir: +d.d, v: d.v, i: +d.i, id: d.id, k: d.k }; }

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]');
  if (!el) {
    return;
  }
  const a = el.dataset.a, x = P(el);
  if (a === 'sheetbg') { if (ev.target === el) closeSheet(); return; }
  if (a === 'infobg') { if (ev.target === el) el.remove(); return; }
  if (a === 'infoclose') { el.closest('.sheet-bg')?.remove(); return; }
  if (a === 'info') { openInfo(x.id); return; }
  const e = ui.view === 'edit' ? entry(ui.editId) : null;
  const person = () => e.blocks[x.bi].items[x.ii][x.who];

  switch (a) {
    case 'nav': ui.view = x.v; ui.editId = null; closeSheet(); render(); scrollTo(0, 0); return;
    case 'new': { const d = draft(false) || newEntry(false); ui.view = 'edit'; ui.editId = d.id; render(); scrollTo(0, 0); return; }
    case 'newduo': { const d = draft(true) || newEntry(true); ui.view = 'edit'; ui.editId = d.id; render(); scrollTo(0, 0); return; }
    case 'open': ui.view = entry(x.id)?.format === 'yoga' ? 'yogaentry' : 'edit'; ui.editId = x.id; render(); scrollTo(0, 0); return;
    case 'closeedit': ui.view = 'hist'; ui.editId = null; persist(); render(); return;
    case 'tipsall': ui.tips = !ui.tips; render(); return;
    case 'more': ui.more.has(x.k) ? ui.more.delete(x.k) : ui.more.add(x.k); render(); return;
    case 'hwho': ui.histWho = x.v; render(); return;
    case 'sheetclose': closeSheet(); return;
    case 'pgrp': ui.sheet.grp = x.v; ui.sheet.q = ''; const sq = $('#sq'); if (sq) sq.value = ''; renderSheet(); $('#sbody').scrollTop = 0; return;
    case 'pickx': applyPick(x.id); return;
    case 'syncnow': doSync(true); return;
    // Yoga
    case 'duoyoga': ui.y.duo = true; ui.view = 'yoga'; render(); scrollTo(0, 0); return;
    case 'ydur': S.settings.yogaDur = +x.v; S.settings.updatedAt = Date.now(); persist(); render(); return;
    case 'ytravel': ui.y.travel = x.v === '1'; render(); return;
    case 'yduo': ui.y.duo = !ui.y.duo; render(); return;
    case 'ytts': S.settings.yogaTts = !yTts(); S.settings.updatedAt = Date.now(); persist(); if (yTts()) speak('Sprachansage an.'); render(); return;
    case 'yfocus': { const f = ui.y.custom.focus; ui.y.custom.focus = f.includes(x.v) ? f.filter(k => k !== x.v) : [...f, x.v]; render(); return; }
    case 'ystyle': ui.y.custom.style = x.v; render(); return;
    case 'yplace': ui.y.custom.place = x.v; render(); return;
    case 'yprog': ui.y.prog = x.id; ui.view = 'yogaprev'; render(); scrollTo(0, 0); return;
    case 'yinfo': openPoseInfo(x.id); return;
    case 'ystart': startYoga(); return;
    case 'yagain': { const en = entry(ui.editId); const y = en.yoga; if (y.custom) ui.y.custom = { ...y.custom }; ui.y.prog = y.prog; ui.y.duo = !!en.duo; ui.y.travel = en.mode === 'travel' && y.prog !== 'custom'; S.settings.yogaDur = y.min || yDur(); ui.view = 'yogaprev'; render(); scrollTo(0, 0); return; }
    case 'ydel': { if (!confirm('Eintrag löschen?')) return; const en = entry(ui.editId); en.deleted = true; en.updatedAt = Date.now(); persist(); ui.view = 'hist'; ui.editId = null; render(); return; }
  }
  if (a === 'zone' || el.classList?.contains('z')) return;

  // Editor-Aktionen
  if (e) {
    switch (a) {
      case 'fmt':
        if (e.format === x.v) return;
        if (e.touched && !confirm('Vorschlag für das neue Format erstellen? Deine Änderungen an den Sets gehen verloren.')) return;
        regenerate(e, { format: x.v }); persist(); render(); return;
      case 'mode': S.settings.lastMode = x.v; regenerate(e, { mode: x.v }); if (x.v === 'travel' && e.format === 'kb') regenerate(e, { format: 'k3' }); persist(); render(); return;
      case 'run': regenerate(e, { runSoon: !e.runSoon }); persist(); render(); return;
      case 'regen': if (e.touched && !confirm('Neu vorschlagen? Deine Änderungen gehen verloren.')) return; regenerate(e); persist(); render(); return;
      case 'warm': e.warmup.type = x.v; touch(e); render(); return;
      case 'warmmin': e.warmup.min = Math.max(1, e.warmup.min + x.dir); touch(e); render(); return;
      case 'rope': countdown('Warm-up', e.warmup.min * 60, 'Seilspringen'); return;
      case 'stretchmin': e.stretch.min = Math.max(1, e.stretch.min + x.dir); touch(e); render(); return;
      case 'stretchtimer': {
        const list = e.stretch.list.length ? e.stretch.list : STRETCHES.map((_, i) => i);
        const parts = list.flatMap(i => STRETCHES[i].side ? [[i, 'links'], [i, 'rechts']] : [[i, '']]);
        const per = Math.max(20, Math.round(e.stretch.min * 60 / parts.length));
        const ph = [];
        parts.forEach(([i, sd], k) => {
          const st = STRETCHES[i], nx = parts[k + 1];
          ph.push({ label: `Dehnung ${list.indexOf(i) + 1}/${list.length}${sd ? ' · ' + sd : ''}`, what: st.n, desc: st.d, img: stretchSVG(st.fig, 'big' + (sd === 'rechts' ? ' flip' : '')),
            next: nx ? STRETCHES[nx[0]].n + (nx[1] ? ' (' + nx[1] + ')' : '') : '', sec: per, kind: 'rest' });
          if (nx) ph.push({ label: nx[0] === i ? 'Seite wechseln' : 'Nächste Dehnung', what: STRETCHES[nx[0]].n, img: stretchSVG(STRETCHES[nx[0]].fig, 'big' + (nx[1] === 'rechts' ? ' flip' : '')), sec: 6, kind: 'plain' });
        });
        runTimer(ph, { title: 'Stretching', onDone: () => { e.stretch.list = [...new Set([...e.stretch.list, ...list])]; touch(e); render(); } });
        return;
      }
      case 'rounds': { const b = e.blocks[x.bi]; b.rounds = Math.max(1, Math.min(8, b.rounds + x.dir));
        b.items.forEach(it => ['e', 'j'].forEach(w => { const p = it[w]; if (p?.rr) { while (p.rr.length < b.rounds) p.rr.push({ ...p.rr[p.rr.length - 1] }); p.rr.length = b.rounds; } }));
        touch(e); render(); return; }
      case 'kbw': { const b = e.blocks[x.bi]; const o = weightOptions(eqp(), 'kb'); b.kbWeight = stepOption(o, b.kbWeight ?? o[0], x.dir); delete b.kbProg;
        b.items.forEach(it => { if (it.e.v === 'kb') { it.e.w = b.kbWeight; if (it.e.rr) it.e.rr.forEach(r => r.w = b.kbWeight); } }); touch(e); render(); return; }
      case 'blockdel': if (e.blocks[x.bi].items.length && !confirm(`Set ${x.bi + 1} löschen?`)) return; e.blocks.splice(x.bi, 1); touch(e); render(); return;
      case 'addblock': e.blocks.push({ rounds: FORMATS[e.format].rounds, items: [], ...(e.format === 'kb' ? { kbWeight: e.blocks[0]?.kbWeight ?? 17 } : {}) }); touch(e); render(); return;
      case 'addex': openPicker(x.bi, null, 'e'); return;
      case 'pick': openPicker(x.bi, x.ii, x.who); return;
      case 'exdel': e.blocks[x.bi].items.splice(x.ii, 1); touch(e); render(); return;
      case 'var': { const p = person(); const ex = EX[p.ex];
        const np = makePerson(S, eqp(), x.who, ex, x.v, e.format, x.who === 'j' ? e.blocks[x.bi].items[x.ii].e : null);
        if (p.reps != null && np.reps != null && !np.prog) np.reps = p.reps;
        if (e.format === 'kb' && x.who === 'e' && x.v === 'kb') np.w = e.blocks[x.bi].kbWeight;
        e.blocks[x.bi].items[x.ii][x.who] = np; touch(e); render(); return; }
      case 'w': { const p = person(); const o = weightOptions(eqp(), p.v); p.w = stepOption(o, p.w ?? o[0], x.dir); delete p.prog; if (p.rr) p.rr.forEach(r => r.w = p.w); touch(e); render(); return; }
      case 'reps': { const p = person(); const ex = EX[p.ex]; const st = ex.u === 's' ? 5 : ex.u === 'm' ? 5 : 1;
        p.reps = Math.max(1, p.reps + x.dir * st); if (p.rr) p.rr.forEach(r => r.reps = p.reps); touch(e); render(); return; }
      case 'rr': { const p = person(); const b = e.blocks[x.bi];
        if (p.rr) delete p.rr; else p.rr = Array.from({ length: b.rounds }, () => ({ reps: p.reps, w: p.w }));
        touch(e); render(); return; }
      case 'rrw': { const p = person(); const o = weightOptions(eqp(), p.v); const r = p.rr[x.ri]; r.w = stepOption(o, r.w ?? o[0], x.dir); touch(e); render(); return; }
      case 'rrreps': { const p = person(); const ex = EX[p.ex]; const st = ex.u === 's' || ex.u === 'm' ? 5 : 1; const r = p.rr[x.ri]; r.reps = Math.max(0, r.reps + x.dir * st); touch(e); render(); return; }
      case 'hiitw': e.hiit.work = Math.max(10, e.hiit.work + 5 * x.dir); touch(e); render(); return;
      case 'hiitr': e.hiit.rest = Math.max(0, e.hiit.rest + 5 * x.dir); touch(e); render(); return;
      case 'hiitrp': e.hiit.roundPause = Math.max(0, e.hiit.roundPause + 15 * x.dir); touch(e); render(); return;
      case 'hiitstart': {
        const b = e.blocks[x.bi]; const items = b.items; if (!items.length) return toast('Erst Übungen hinzufügen');
        const nm = it => EX[it.e.ex].n + (isLoaded(it.e.v) ? ` · ${num(it.e.w)} kg` : '') + (e.duo && it.j ? ` | J: ${EX[it.j.ex].n}${isLoaded(it.j.v) ? ' ' + num(it.j.w) + ' kg' : ''}` : '');
        const ph = [{ label: 'Gleich geht’s los', what: nm(items[0]), sec: 10, kind: 'rest' }];
        for (let r = 0; r < b.rounds; r++) items.forEach((it, k) => {
          const nxt = items[k + 1] || (r + 1 < b.rounds ? items[0] : null);
          ph.push({ label: `Runde ${r + 1}/${b.rounds} · ${k + 1}/${items.length}`, what: nm(it), next: nxt ? EX[nxt.e.ex].n : 'Fertig', sec: e.hiit.work, kind: 'work' });
          const last = k === items.length - 1;
          if (!last && e.hiit.rest) ph.push({ label: 'Pause', what: nxt ? nm(nxt) : '', sec: e.hiit.rest, kind: 'rest' });
          if (last && r + 1 < b.rounds && e.hiit.roundPause) ph.push({ label: 'Rundenpause', what: nm(items[0]), sec: e.hiit.roundPause, kind: 'rest' });
        });
        runTimer(ph, { title: 'HIIT' });
        return;
      }
      case 'extimer': {
        const p = person(); const ex = EX[p.ex];
        const sec = p.reps;
        const name = ex.n + (e.duo ? (x.who === 'j' ? ' · Jenny' : ' · Eric') : '');
        const ph = [{ label: 'Gleich geht\u2019s los', what: name, sec: 5, kind: 'rest' }];
        if (ex.side) ph.push({ label: 'Seite 1', what: name, next: 'Seitenwechsel', sec, kind: 'work' }, { label: 'Seitenwechsel', what: name, sec: 5, kind: 'rest' }, { label: 'Seite 2', what: name, sec, kind: 'work' });
        else ph.push({ label: 'Halten', what: name, sec, kind: 'work' });
        runTimer(ph, { title: ex.n });
        return;
      }
      case 'pause': countdown('Pause', FORMATS[e.format].pause, 'Durchatmen – nächste Runde'); return;
      case 'save': {
        e.done = true; e.end = Date.now(); e.updatedAt = Date.now();
        delete e.notes; delete e.warn; delete e.touched;
        e.blocks = e.blocks.filter(b => b.items.length);
        S.settings.rope = e.warmup.min || S.settings.rope;
        persist(); ui.view = e.duo ? 'duo' : 'start'; ui.editId = null; render(); scrollTo(0, 0); toast('Training gespeichert 💪'); return;
      }
      case 'discard': if (!confirm('Training verwerfen?')) return;
        // Als gelöscht markieren statt entfernen – sonst holt der Sync den Entwurf aus GitHub zurück
        e.deleted = true; e.blocks = []; e.updatedAt = Date.now(); persist(); ui.view = e.duo ? 'duo' : 'start'; ui.editId = null; render(); return;
      case 'delete': if (!confirm('Eintrag endgültig löschen?')) return; e.deleted = true; e.blocks = []; e.updatedAt = Date.now(); persist(); ui.view = 'hist'; ui.editId = null; render(); return;
    }
  }

  // Equipment
  const eq = eqp();
  const eqChanged = () => { eq.updatedAt = Date.now(); clearCache(); persist(); render(); };
  switch (a) {
    case 'eqon': eq.implements[x.i].on = eq.implements[x.i].on === false; return eqChanged();
    case 'eqacc': { const im = eq.implements[x.i]; im.accepts = im.accepts || []; im.accepts = im.accepts.includes(x.v) ? im.accepts.filter(t => t !== x.v) : [...im.accepts, x.v]; return eqChanged(); }
    case 'eqdel': if (!confirm(`${eq.implements[x.i].n} entfernen?`)) return; eq.implements.splice(x.i, 1); return eqChanged();
    case 'eqadd': eq.implements.push({ id: uid(), type: 'other', n: 'Neues Gerät', count: 1, on: true }); return eqChanged();
    case 'pldel': eq.plates.splice(x.i, 1); return eqChanged();
    case 'pladd': eq.plates.push({ id: uid(), w: 1.25, type: 'A', count: 2 }); return eqChanged();
    case 'eqreset': if (!confirm('Equipment auf den Stand aus dem Kompendium zurücksetzen?')) return; S.equipment = { ...structuredClone(DEFAULT_EQUIPMENT), updatedAt: Date.now() }; clearCache(); persist(); render(); return;
    case 'defrope': S.settings.rope = Math.max(1, S.settings.rope + x.dir); S.settings.updatedAt = Date.now(); persist(); render(); return;
    case 'defstretch': S.settings.stretch = Math.max(1, S.settings.stretch + x.dir); S.settings.updatedAt = Date.now(); persist(); render(); return;
    case 'export': {
      const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
      const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = `workout-diary-${new Date().toISOString().slice(0, 10)}.json`; l.click(); return;
    }
    case 'import': {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
      inp.onchange = async () => { try { const data = JSON.parse(await inp.files[0].text()); S = merge(S, data); persist(); render(); toast('Importiert ✓'); } catch (err) { toast('Datei konnte nicht gelesen werden'); } };
      inp.click(); return;
    }
  }
});

// Körperkarte antippen
document.addEventListener('click', ev => {
  const z = ev.target.closest('.z'); if (!z || ui.view !== 'start') return;
  ui.zone = ui.zone === z.dataset.z ? null : z.dataset.z;
  render();
});

document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.dataset.a === 'note') { const e = entry(ui.editId); if (e) { e.note = t.value; e.updatedAt = Date.now(); persist(); } }
  if (t.dataset.cfg) { const c = syncCfg(); c[t.dataset.cfg] = t.value.trim(); setSyncCfg(c); }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.a === 'stretchck') { const e = entry(ui.editId); const i = +t.dataset.i; e.stretch.list = t.checked ? [...new Set([...e.stretch.list, i])] : e.stretch.list.filter(k => k !== i); touch(e); }
  if (t.dataset.eq) {
    const eq = eqp(); const obj = t.dataset.eq === 'im' ? eq.implements[+t.dataset.i] : eq.plates[+t.dataset.i];
    const f = t.dataset.f; let v = t.value;
    if (['count', 'base', 'maxLoad', 'w'].includes(f)) v = v === '' ? undefined : Math.max(0, parseFloat(v.replace(',', '.')) || 0);
    if (v === undefined) delete obj[f]; else obj[f] = v;
    eq.updatedAt = Date.now(); clearCache(); persist(); render();
  }
});

// Start
render();
if (syncCfg().token) doSync();
// Nachholen, sobald wieder Netz da ist oder die App wieder in den Vordergrund kommt
window.addEventListener('online', () => scheduleSync(500));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') scheduleSync(500); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
