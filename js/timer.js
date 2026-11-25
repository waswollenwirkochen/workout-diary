// Vollbild-Timer: Countdown (Seil, Pause, Stretching) und HIIT-Intervalle mit Signaltönen
let ctx = null, wake = null;

function beep(freq = 880, dur = 0.12, vol = 0.25) {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
  } catch (e) { }
}
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } };
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) wake = await navigator.wakeLock.request('screen');
    else if (!on && wake) { await wake.release(); wake = null; }
  } catch (e) { }
}

// phases: [{label, what, next, sec, kind: 'work'|'rest'|'plain'}]
export function runTimer(phases, { title = '', onDone, onPhase, soft = false } = {}) {
  beep(1, 0.01, 0.001); // AudioContext per Nutzer-Geste entsperren
  const el = document.createElement('div');
  el.className = 'timer';
  document.body.appendChild(el);
  keepAwake(true);
  let i = 0, left = phases[0].sec, paused = false, last = performance.now(), raf, acc = 0;
  const total = phases.reduce((s, p) => s + p.sec, 0);
  let elapsedBefore = 0;

  function render() {
    const p = phases[i];
    el.className = 'timer ' + (p.kind || 'plain');
    const mm = Math.floor(Math.ceil(left) / 60), ss = Math.ceil(left) % 60;
    const done = elapsedBefore + (p.sec - left);
    el.innerHTML = `
      <div class="ph">${title ? title + ' · ' : ''}${p.label || ''}</div>
      ${p.img ? `<div class="fig">${p.img}</div>` : ''}
      <div class="big ${p.img ? 'withimg' : ''}">${p.sec >= 60 ? mm + ':' + String(ss).padStart(2, '0') : Math.ceil(left)}</div>
      <div class="what">${p.what || ''}</div>
      ${p.desc ? `<div class="desc">${p.desc}</div>` : ''}
      <div class="next">${p.next ? 'Danach: ' + p.next : ''}</div>
      <div class="prog"><i style="width:${(100 * done / total).toFixed(1)}%"></i></div>
      <div class="tb">
        <button class="btn" data-t="prev">⏮</button>
        <button class="btn primary" data-t="pause" style="min-width:120px">${paused ? '▶ Weiter' : '⏸ Pause'}</button>
        <button class="btn" data-t="next">⏭</button>
      </div>
      <button class="btn ghost" data-t="stop" style="margin-top:14px">Beenden</button>`;
  }
  function go(n) {
    elapsedBefore = phases.slice(0, n).reduce((s, p) => s + p.sec, 0);
    i = n; left = phases[i].sec;
    const k = phases[i].kind;
    if (soft) { if (!phases[i].quiet) beep(523, 0.5, 0.12); }
    else { beep(k === 'work' ? 1046 : 660, 0.35, 0.35); buzz(k === 'work' ? [200, 80, 200] : 300); }
    onPhase && onPhase(phases[i], i);
    render();
  }
  function finish(completed) {
    const elapsed = Math.round(elapsedBefore + (phases[i].sec - Math.max(0, left)));
    cancelAnimationFrame(raf); keepAwake(false); el.remove();
    if (completed) { beep(1318, 0.5, 0.4); buzz([300, 100, 300, 100, 500]); }
    onDone && onDone(completed, elapsed);
  }
  function tick(t) {
    const dt = (t - last) / 1000; last = t;
    if (!paused) {
      const before = Math.ceil(left);
      left -= dt;
      const now = Math.ceil(left);
      if (now !== before && now <= 3 && now > 0 && !phases[i].quiet && !soft) beep(880, 0.1, 0.25);
      if (left <= 0) { if (i + 1 < phases.length) go(i + 1); else return finish(true); }
      else if (now !== before) render();
    }
    raf = requestAnimationFrame(tick);
  }
  el.addEventListener('click', e => {
    const a = e.target.closest('[data-t]')?.dataset.t; if (!a) return;
    if (a === 'pause') { paused = !paused; render(); }
    if (a === 'next') { if (i + 1 < phases.length) go(i + 1); else finish(true); }
    if (a === 'prev') go(Math.max(0, left < phases[i].sec - 2 ? i : i - 1));
    if (a === 'stop') finish(false);
  });
  onPhase && onPhase(phases[0], 0);
  render(); raf = requestAnimationFrame(tick);
}

// Sprachausgabe (Web Speech API, deutsche Stimme)
let voice = null;
function pickVoice() {
  try { const vs = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith('de')); voice = vs.find(v => /google|anna|petra|helena|katja/i.test(v.name)) || vs[0] || null; } catch (e) { }
}
if (typeof speechSynthesis !== 'undefined') { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
export function speak(text) {
  try {
    if (!text || typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE'; if (voice) u.voice = voice; u.rate = 0.95; u.pitch = 1;
    speechSynthesis.speak(u);
  } catch (e) { }
}
export function stopSpeak() { try { speechSynthesis.cancel(); } catch (e) { } }

export function countdown(label, sec, what, onDone) {
  runTimer([{ label, what, sec, kind: 'work' }], { onDone });
}
