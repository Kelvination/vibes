// Wall Hugger — app shell: menus, race loop, editor wiring, settings, records.

import { TUNING } from './tuning.js';
import { compile } from './blocks.js';
import { createRace, step, respawn, ticksToMs, fmtTime, medalFor } from './sim.js';
import { CAMPAIGN, campaignMap } from './campaign.js';
import { Renderer3D } from './render.js';
import { Hud } from './hud.js';
import { GameAudio } from './audio.js';
import { Editor } from './editor.js';
import * as persist from './persist.js';

const $ = (id) => document.getElementById(id);
const DEFAULT_TUNING = JSON.parse(JSON.stringify(TUNING));

const app = {
  mode: 'menu',          // 'menu' | 'race' | 'editor'
  settings: persist.loadSettings(),
  renderer: null, hud: null, audio: null, editor: null,
  keys: new Set(),
  touch: { gas: false, brake: false, left: false, right: false, ers: false },
  ersToggleOn: false,
  race: null,            // { rs, map, track, prev, ghost, test, rec }
  acc: 0, lastT: 0,
};

// ---------- screens ----------

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}

function toMenu() {
  app.mode = 'menu';
  app.race = null;
  app.editor.exit();
  $('finish-panel').classList.remove('show');
  $('tuning-panel').classList.remove('show');
  showScreen('screen-menu');
}

// ---------- campaign / library lists ----------

const MEDAL_ICON = { author: '◆', gold: '●', silver: '●', bronze: '●' };

function renderCampaignList() {
  const el = $('campaign-list');
  el.innerHTML = '';
  for (const m of CAMPAIGN) {
    const rec = persist.getRecord(`campaign:${m.id}`);
    const medal = rec?.pb != null ? medalFor(rec.pb, m) : null;
    const row = document.createElement('button');
    row.className = 'list-row';
    row.innerHTML = `
      <span class="medal ${medal ? 'm-' + medal : 'm-none'}">${medal ? MEDAL_ICON[medal] : '○'}</span>
      <span class="row-name">${m.name}</span>
      <span class="row-pb">${rec?.pb != null ? fmtTime(rec.pb) : '—'}</span>`;
    row.onclick = () => startRace(campaignMap(m.id));
    el.appendChild(row);
  }
}

function renderLibrary() {
  const el = $('library-list');
  el.innerHTML = '';
  const maps = persist.listCustomMaps();
  if (!maps.length) el.innerHTML = '<p class="dim">No custom maps yet. Build one in the editor!</p>';
  for (const m of maps) {
    const rec = persist.getRecord(m.key);
    const row = document.createElement('div');
    row.className = 'list-row static';
    row.innerHTML = `
      <span class="row-name">${escapeHtml(m.name)}</span>
      <span class="row-pb">${rec?.pb != null ? fmtTime(rec.pb) : '—'}</span>
      <span class="row-actions">
        <button data-act="play">Play</button>
        <button data-act="edit">Edit</button>
        <button data-act="export">Share</button>
        <button data-act="del">✕</button>
      </span>`;
    row.querySelector('[data-act=play]').onclick = () => startRace(m);
    row.querySelector('[data-act=edit]').onclick = () => enterEditor(m);
    row.querySelector('[data-act=export]').onclick = async () => {
      const str = await persist.exportMapString(m);
      try { await navigator.clipboard.writeText(str); flashStatus('Share code copied to clipboard'); }
      catch { persist.downloadMapFile(m, str); }
    };
    row.querySelector('[data-act=del]').onclick = () => {
      if (confirm(`Delete "${m.name}"?`)) { persist.deleteCustomMap(m.key); renderLibrary(); }
    };
    el.appendChild(row);
  }
}

function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function flashStatus(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(flashStatus._t);
  flashStatus._t = setTimeout(() => el.classList.remove('show'), 2200);
}

// ---------- race ----------

function startRace(map, { test = false, draft = null } = {}) {
  const track = compile(map.placements);
  if (track.error) { flashStatus(track.error); return; }
  app.editor.exit();
  app.mode = 'race';
  const rec = map.key ? persist.getRecord(map.key) : null;
  app.race = {
    rs: createRace(track, { laps: map.laps || 1 }), map, track, test, draft, rec,
    prev: null,
    ghost: app.settings.ghost && rec?.ghost ? rec.ghost : null,
  };
  app.ersToggleOn = false;
  app.renderer.showGuides = false;
  app.renderer.buildTrack(track);
  app.renderer.car.visible = true;
  app.renderer.ghost.visible = false;
  app.renderer.camMode = 'chase';
  snapPrev();
  app.renderer.snapCamera(app.race.rs.car);
  app.hud.reset();
  app.hud.setMapInfo(map, rec);
  $('finish-panel').classList.remove('show');
  showScreen('screen-game');
  app.audio.ensure();
}

function restartRace() {
  const r = app.race;
  if (!r) return;
  r.rs = createRace(r.track, { laps: r.map.laps || 1 }); // instant: track/scene untouched (PRD §3, < 100 ms)
  r.ghost = app.settings.ghost && r.rec?.ghost ? r.rec.ghost : null;
  app.ersToggleOn = false;
  snapPrev();
  app.renderer.snapCamera(r.rs.car);
  app.hud.reset();
  $('finish-panel').classList.remove('show');
}

function snapPrev() {
  const c = app.race.rs.car;
  app.race.prev = { x: c.x, z: c.z, h: c.h };
}

function sampleInput() {
  const k = app.keys, tc = app.touch;
  const mode = app.settings.ersMode;
  const hold = k.has('shift');
  // the touch ERS button is always hold-to-deploy, regardless of ERS mode
  const deploy = (mode !== 'toggle' && hold) || (mode !== 'hold' && app.ersToggleOn) || tc.ers;
  // Steer sign: the chase camera looks down +z, which mirrors world X on
  // screen, so the sim's internal +steer (turns toward +x) reads as a LEFT
  // turn to the player. Map the controls accordingly: left key -> +1.
  const left = k.has('a') || k.has('arrowleft') || tc.left;
  const right = k.has('d') || k.has('arrowright') || tc.right;
  return {
    throttle: k.has('w') || k.has('arrowup') || tc.gas,
    brake: k.has('s') || k.has('arrowdown') || tc.brake,
    steer: (left ? 1 : 0) - (right ? 1 : 0),
    deploy,
  };
}

function processEvents(rs) {
  for (const e of rs.events) {
    switch (e.type) {
      case 'beep': app.audio.beep(e.n); break;
      case 'go': app.audio.go(); break;
      case 'checkpoint': {
        app.audio.checkpoint();
        const label = (e.laps > 1 ? `L${e.lap} · ` : '') + `CP ${e.index}/${e.total}`;
        app.hud.split(e.split, e.ticks, app.race.rec?.splits, label);
        break;
      }
      case 'lap':
        app.audio.checkpoint();
        app.hud.popup(`LAP ${e.lap}/${e.total}`, 'lap');
        break;
      case 'zoneAward':
        app.hud.popup(`+${Math.max(1, Math.round(e.award))} ${e.rating}`, e.rating.toLowerCase());
        app.audio.award(e.rating);
        break;
      case 'zoneVoid':
        app.hud.popup('VOID', 'void');
        app.audio.voidBuzz();
        break;
      case 'finish': onFinish(e.ticks); break;
    }
  }
  rs.events.length = 0;
}

function onFinish(ticks) {
  const r = app.race;
  const ms = ticksToMs(ticks);
  const rs = r.rs;

  if (r.test) {
    r.draft.authorTime = ms;
    $('finish-title').textContent = 'Author time set!';
    $('finish-time').textContent = fmtTime(ms);
    $('finish-medal').textContent = 'Save the map in the editor to keep it.';
    $('finish-medal').className = '';
    $('finish-delta').textContent = '';
    $('btn-next').style.display = 'none';
    $('btn-back-editor').style.display = '';
    $('finish-panel').classList.add('show');
    app.audio.finishChime();
    return;
  }

  const prevPb = r.rec?.pb;
  const improved = prevPb == null || ms < prevPb;
  if (improved && r.map.key) {
    persist.setRecord(r.map.key, { pb: ms, splits: rs.splits.slice(), ghost: rs.ghost.slice() });
    r.rec = persist.getRecord(r.map.key);
  }
  const medal = medalFor(ms, r.map);
  $('finish-title').textContent = improved ? 'New personal best!' : 'Finished';
  $('finish-time').textContent = fmtTime(ms);
  $('finish-medal').textContent = medal ? `${MEDAL_ICON[medal]} ${medal.toUpperCase()} medal` : '';
  $('finish-medal').className = medal ? `m-${medal}` : '';
  $('finish-delta').textContent = prevPb != null
    ? (improved ? `−${fmtTime(prevPb - ms)} vs old PB` : `+${fmtTime(ms - prevPb)} vs PB ${fmtTime(prevPb)}`)
    : '';
  const isCampaign = !!r.map.campaign;
  const next = isCampaign ? CAMPAIGN[CAMPAIGN.findIndex((c) => `campaign:${c.id}` === r.map.key) + 1] : null;
  $('btn-next').style.display = next ? '' : 'none';
  $('btn-next').onclick = () => startRace(campaignMap(next.id));
  $('btn-back-editor').style.display = 'none';
  $('finish-panel').classList.add('show');
  app.audio.finishChime();
}

// ---------- editor ----------

function enterEditor(map) {
  app.mode = 'editor';
  app.race = null;
  showScreen('screen-editor');
  app.editor.enter(map || null);
}

function backFromTest() {
  const draft = app.race?.draft;
  app.race = null;
  $('finish-panel').classList.remove('show');
  app.mode = 'editor';
  showScreen('screen-editor');
  app.editor.enter(draft);
  if (draft.authorTime) app.editor.setAuthorTime(draft.authorTime);
}

// ---------- settings ----------

function applySettingsUI() {
  document.querySelectorAll('input[name=ersmode]').forEach((r) => { r.checked = r.value === app.settings.ersMode; });
  $('set-audio').checked = app.settings.audio;
  $('set-ghost').checked = app.settings.ghost;
}

function bindSettings() {
  document.querySelectorAll('input[name=ersmode]').forEach((r) => {
    r.onchange = () => { app.settings.ersMode = r.value; persist.saveSettings(app.settings); };
  });
  $('set-audio').onchange = (e) => {
    app.settings.audio = e.target.checked;
    persist.saveSettings(app.settings);
    app.audio.setEnabled(app.settings.audio);
    if (app.settings.audio) app.audio.ensure();
  };
  $('set-ghost').onchange = (e) => { app.settings.ghost = e.target.checked; persist.saveSettings(app.settings); };
}

// ---------- debug tuning panel (PRD M1) ----------

function buildTuningPanel() {
  const body = $('tuning-body');
  body.innerHTML = '';
  for (const key of Object.keys(TUNING)) {
    const v = TUNING[key];
    if (typeof v !== 'number') continue;
    const row = document.createElement('label');
    row.className = 'tune-row';
    const dv = DEFAULT_TUNING[key];
    row.innerHTML = `<span>${key}</span><input type="range" min="0" max="${dv * 3}" step="${dv / 200 || 0.01}" value="${v}"><b>${v}</b>`;
    const input = row.querySelector('input');
    const out = row.querySelector('b');
    input.oninput = () => { TUNING[key] = +input.value; out.textContent = (+input.value).toFixed(3).replace(/\.?0+$/, ''); };
    body.appendChild(row);
  }
  $('tuning-reset').onclick = () => {
    for (const k of Object.keys(DEFAULT_TUNING)) if (typeof DEFAULT_TUNING[k] === 'number') TUNING[k] = DEFAULT_TUNING[k];
    buildTuningPanel();
  };
}

// ---------- input ----------

const GAME_KEYS = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'backspace', 'delete', 'enter']);

function bindKeys() {
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (app.mode !== 'menu' && GAME_KEYS.has(k) && document.activeElement?.tagName !== 'INPUT') e.preventDefault();

    if (k === 'f2') { $('tuning-panel').classList.toggle('show'); e.preventDefault(); return; }

    if (app.mode === 'editor') {
      if (document.activeElement?.tagName === 'INPUT') { if (k === 'escape') document.activeElement.blur(); return; }
      if (k === 'escape') { toMenu(); return; }
      if (app.editor.key(e)) { e.preventDefault(); return; }
      return;
    }

    if (app.mode === 'race') {
      app.keys.add(k);
      app.audio.ensure();
      const rs = app.race.rs;
      if (k === 'backspace' || k === 'delete') restartRace();
      else if (k === 'enter') { respawn(rs); snapPrev(); app.renderer.snapCamera(rs.car); }
      else if (k === 'e') { if (app.settings.ersMode !== 'hold') app.ersToggleOn = !app.ersToggleOn; }
      else if (k === 'g') { app.settings.ghost = !app.settings.ghost; persist.saveSettings(app.settings); app.race.ghost = app.settings.ghost ? app.race.rec?.ghost : null; flashStatus(`Ghost ${app.settings.ghost ? 'on' : 'off'}`); }
      else if (k === 'c') { app.renderer.camMode = app.renderer.camMode === 'chase' ? 'hood' : 'chase'; }
      else if (k === 'escape') {
        if (app.race.test) backFromTest();
        else { toMenu(); renderCampaignList(); }
      }
    }
  });
  addEventListener('keyup', (e) => app.keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => app.keys.clear());
}

// ---------- touch controls (mobile) ----------

function bindTouch() {
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouch) return;
  document.body.classList.add('touch');

  const hold = (id, key) => {
    const el = $(id);
    const set = (v) => (e) => { e.preventDefault(); app.touch[key] = v; if (v) app.audio.ensure(); };
    el.addEventListener('pointerdown', set(true));
    el.addEventListener('pointerup', set(false));
    el.addEventListener('pointercancel', set(false));
    el.addEventListener('lostpointercapture', set(false));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  };
  hold('tc-gas', 'gas');
  hold('tc-brake', 'brake');
  hold('tc-left', 'left');
  hold('tc-right', 'right');
  hold('tc-ers', 'ers');

  $('tc-restart').onclick = () => { if (app.mode === 'race') restartRace(); };
  $('tc-respawn').onclick = () => {
    if (app.mode !== 'race' || !app.race) return;
    respawn(app.race.rs);
    snapPrev();
    app.renderer.snapCamera(app.race.rs.car);
  };
  $('tc-menu').onclick = () => {
    if (app.mode !== 'race') return;
    if (app.race?.test) backFromTest();
    else { toMenu(); renderCampaignList(); }
  };
}

// ---------- main loop ----------

function frame(now) {
  requestAnimationFrame(frame);
  const dtReal = Math.min((now - app.lastT) / 1000 || 0, 0.1);
  app.lastT = now;

  if (app.mode === 'race' && app.race) {
    const r = app.race;
    const rs = r.rs;
    app.acc += dtReal;
    const input = sampleInput();
    let guard = 0;
    while (app.acc >= TUNING.dt && guard++ < 30) {
      snapPrev();
      step(rs, input);
      processEvents(rs);
      app.acc -= TUNING.dt;
    }
    const a = Math.min(app.acc / TUNING.dt, 1);
    const c = rs.car, p = r.prev;
    let dh = c.h - p.h;
    if (dh > Math.PI) dh -= 2 * Math.PI; else if (dh < -Math.PI) dh += 2 * Math.PI;
    const ix = p.x + (c.x - p.x) * a, iz = p.z + (c.z - p.z) * a, ih = p.h + dh * a;

    app.renderer.updateCar(app.renderer.car, ix, iz, ih, rs.deploying, {
      pitch: c.susPitch, roll: c.susRoll, heave: c.susHeave, steer: c.steerAngle,
    });
    app.renderer.updateZones(rs.zones);
    app.renderer.updateSparks(c, rs.zoneLive);
    app.renderer.updateChase({ x: ix, z: iz, h: ih }, c.speed, rs.deploying, dtReal);

    // PB ghost playback (every-2-ticks samples)
    if (r.ghost && rs.phase !== 'countdown') {
      const gi = Math.min(Math.floor(rs.tick / 2), r.ghost.length / 3 - 1);
      if (gi >= 0) {
        app.renderer.ghost.visible = true;
        app.renderer.updateCar(app.renderer.ghost, r.ghost[gi * 3] / 100, r.ghost[gi * 3 + 1] / 100, r.ghost[gi * 3 + 2] / 1000, false);
      }
    } else {
      app.renderer.ghost.visible = false;
    }

    app.hud.update(rs);
    app.audio.update({
      speed: c.speed,
      racing: rs.phase === 'racing',
      deploying: !!rs.deploying,
      closeness: rs.zoneLive.closeness,
      inZone: rs.zoneLive.active,
      slip: Math.abs(c.vL) + (c.sliding ? 6 : 0),
    });
  } else if (app.mode === 'editor') {
    app.editor.frame();
    app.audio.update({ racing: false });
  } else {
    app.audio.update({ racing: false });
  }

  app.renderer.render(dtReal);
}

// ---------- boot ----------

function boot() {
  app.renderer = new Renderer3D($('gameCanvas'));
  app.hud = new Hud();
  app.audio = new GameAudio();
  app.audio.enabled = app.settings.audio;

  app.editor = new Editor(app.renderer, {
    onTest(map) {
      startRace(map, { test: true, draft: map });
    },
    setStatus(msg) { $('editor-status').textContent = msg; },
  });

  // menu buttons
  $('btn-campaign').onclick = () => { renderCampaignList(); showScreen('screen-campaign'); };
  $('btn-editor').onclick = () => enterEditor(null);
  $('btn-library').onclick = () => { renderLibrary(); showScreen('screen-library'); };
  $('btn-settings').onclick = () => { applySettingsUI(); showScreen('screen-settings'); };
  $('btn-help').onclick = () => showScreen('screen-help');
  document.querySelectorAll('.btn-back').forEach((b) => { b.onclick = toMenu; });

  // editor toolbar
  $('editor-save').onclick = () => {
    const errs = app.editor.validateMap();
    if (errs.length) { flashStatus(errs.join('; ')); return; }
    const map = app.editor.currentMap();
    app.editor.mapKey = map.key;
    persist.saveCustomMap(map);
    flashStatus(`Saved "${map.name}"${map.authorTime ? '' : ' (no author time yet — Test to set medals)'}`);
  };
  $('editor-test').onclick = () => {
    const errs = app.editor.validateMap();
    if (errs.length) { flashStatus('Cannot test: ' + errs.join('; ')); return; }
    const map = app.editor.currentMap();
    startRace(map, { test: true, draft: map });
  };
  $('editor-export').onclick = async () => {
    const map = app.editor.currentMap();
    const str = await persist.exportMapString(map);
    try { await navigator.clipboard.writeText(str); flashStatus('Share code copied to clipboard'); }
    catch { persist.downloadMapFile(map, str); }
  };
  $('editor-exit').onclick = toMenu;

  // library import
  $('btn-import').onclick = async () => {
    const str = $('import-text').value;
    if (!str.trim()) { flashStatus('Paste a share code first'); return; }
    try {
      const map = await persist.importMapString(str);
      persist.saveCustomMap(map);
      $('import-text').value = '';
      renderLibrary();
      flashStatus(`Imported "${map.name}"`);
    } catch (err) { flashStatus('Import failed: ' + err.message); }
  };

  // finish panel
  $('btn-retry').onclick = () => restartRace();
  $('btn-finish-menu').onclick = () => { toMenu(); };
  $('btn-back-editor').onclick = () => backFromTest();

  bindSettings();
  bindKeys();
  bindTouch();
  buildTuningPanel();
  addEventListener('resize', () => app.renderer.resize());
  addEventListener('pointerdown', () => app.audio.ensure(), { once: true });

  showScreen('screen-menu');
  window.wallhugger = { app, startRace, enterEditor }; // debug/testing hook
  requestAnimationFrame(frame);
}

boot();
