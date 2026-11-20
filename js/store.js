// Datenhaltung: localStorage + optionaler Sync in eine JSON-Datei in einem GitHub-Repo
import { DEFAULT_EQUIPMENT } from './equip.js';

const KEY = 'wd.state.v1';
const CFG = 'wd.sync.v1';

export function emptyState() {
  return { v: 1, entries: [], equipment: { ...structuredClone(DEFAULT_EQUIPMENT), updatedAt: 0 }, settings: { updatedAt: 0, rope: 3, stretch: 8, hiitRounds: 3 }, updatedAt: 0 };
}

export function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.entries) return migrate(s); } catch (e) { }
  return emptyState();
}
function migrate(s) {
  const e = emptyState();
  s.equipment = s.equipment || e.equipment;
  s.settings = { ...e.settings, ...(s.settings || {}) };
  // Update: KH Typ A trägt bis 20 kg (2× 5er + Rest) – nur wenn das Equipment noch nie bearbeitet wurde
  const khA = s.equipment.implements?.find(i => i.id === 'khA');
  if (khA && khA.maxLoad === 10 && !s.equipment.updatedAt) khA.maxLoad = 20;
  return s;
}
export function saveLocal(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn(e); }
}

export function syncCfg() {
  try { return { owner: 'waswollenwirkochen', repo: 'workout-diary-data', path: 'data.json', branch: 'main', token: '', ...JSON.parse(localStorage.getItem(CFG) || '{}') }; }
  catch { return { owner: 'waswollenwirkochen', repo: 'workout-diary-data', path: 'data.json', branch: 'main', token: '' }; }
}
export function setSyncCfg(c) { localStorage.setItem(CFG, JSON.stringify(c)); }

// Zusammenführen: Einträge je ID nach updatedAt, Equipment/Settings nach updatedAt
export function merge(a, b) {
  const map = new Map();
  for (const e of [...(a.entries || []), ...(b.entries || [])]) {
    const cur = map.get(e.id);
    if (!cur || (e.updatedAt || 0) > (cur.updatedAt || 0)) map.set(e.id, e);
  }
  const pick = (x, y) => ((x?.updatedAt || 0) >= (y?.updatedAt || 0) ? x : y);
  return {
    v: 1,
    entries: [...map.values()].sort((x, y) => y.ts - x.ts),
    equipment: pick(a.equipment, b.equipment),
    settings: pick(a.settings, b.settings),
    updatedAt: Math.max(a.updatedAt || 0, b.updatedAt || 0)
  };
}

const b64enc = str => { const bytes = new TextEncoder().encode(str); let bin = ''; bytes.forEach(b => bin += String.fromCharCode(b)); return btoa(bin); };
const b64dec = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), c => c.charCodeAt(0)));

function api(cfg, method = 'GET', body) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(cfg.path)}` + (method === 'GET' ? `?ref=${cfg.branch}&t=${Date.now()}` : '');
  return fetch(url, {
    method, cache: 'no-store',
    headers: { Authorization: `Bearer ${cfg.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
}

export async function pull(cfg) {
  const r = await api(cfg);
  if (r.status === 404) return { state: null, sha: null };
  if (!r.ok) throw new Error(errText(r.status));
  const j = await r.json();
  return { state: JSON.parse(b64dec(j.content)), sha: j.sha };
}

// Holt den Remote-Stand, führt zusammen und schreibt zurück (mit einem Retry bei Konflikt)
export async function sync(cfg, local) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { state: remote, sha } = await pull(cfg);
    const merged = remote ? merge(local, remote) : local;
    const same = remote && JSON.stringify(remote) === JSON.stringify(merged);
    if (same) return merged;
    const r = await api(cfg, 'PUT', {
      message: `Workout-Daten ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
      content: b64enc(JSON.stringify(merged, null, 1)),
      branch: cfg.branch, ...(sha ? { sha } : {})
    });
    if (r.ok) return merged;
    if (r.status === 409 || r.status === 422) continue;
    throw new Error(errText(r.status));
  }
  throw new Error('Konflikt beim Speichern – bitte nochmal versuchen');
}

function errText(s) {
  return ({ 401: 'Token ungültig oder abgelaufen', 403: 'Token hat keine Schreibrechte für dieses Repo', 404: 'Repo nicht gefunden – Name prüfen und Token-Zugriff auf das Repo erlauben' })[s] || `GitHub-Fehler ${s}`;
}
