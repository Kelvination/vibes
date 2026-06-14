// Wall Hugger — driving HUD (PRD §8.3). Plain DOM, updated per frame.

import { fmtTime, ticksToMs } from './sim.js';

const $ = (id) => document.getElementById(id);

export class Hud {
  constructor() {
    this.speedEl = $('hud-speed');
    this.timeEl = $('hud-time');
    this.ersFill = $('hud-ers-fill');
    this.ersBar = $('hud-ers');
    this.ersLabel = this.ersBar.querySelector('.ers-label');
    this.zoneEl = $('hud-zone');
    this.zoneLabel = this.zoneEl.querySelector('.zone-label');
    this.zoneFill = $('hud-zone-fill');
    this.vignette = $('speed-vignette');
    this.coachEl = $('hud-coach');
    this.pbEl = $('hud-pb');
    this.medalsEl = $('hud-medals');
    this.cpEl = $('hud-cp');
    this.popupsEl = $('hud-popups');
    this.countdownEl = $('hud-countdown');
    this.splitEl = $('hud-split');
    this.splitTimer = 0;
  }

  setMapInfo(map, rec) {
    this.pbEl.textContent = `PB ${fmtTime(rec?.pb)}`;
    if (map.authorTime) {
      this.medalsEl.innerHTML =
        `<span class="m-author">◆ ${fmtTime(map.authorTime)}</span>` +
        `<span class="m-gold">★ ${fmtTime(Math.round(map.authorTime * 1.06))}</span>` +
        `<span class="m-silver">✦ ${fmtTime(Math.round(map.authorTime * 1.20))}</span>` +
        `<span class="m-bronze">✸ ${fmtTime(Math.round(map.authorTime * 1.50))}</span>`;
    } else {
      this.medalsEl.innerHTML = '<span class="m-none">no author time</span>';
    }
  }

  update(rs) {
    const kmh = Math.round(rs.car.speed * 3.6);
    this.speedEl.textContent = kmh;
    this.timeEl.textContent = rs.phase === 'countdown' ? '00:00.000'
      : fmtTime(ticksToMs(rs.finished ? rs.finalTicks : rs.tick));

    this.ersFill.style.width = `${rs.ers}%`;
    this.ersBar.classList.toggle('deploying', !!rs.deploying);
    this.ersBar.classList.toggle('charging', rs.zoneLive.active);
    this.ersBar.classList.toggle('ready', rs.ers > 1 && !rs.deploying);
    this.ersLabel.textContent = rs.deploying ? `ERS +${rs.boostPct}%`
      : rs.ers > 1 ? 'ERS ⚡ Shift' : 'ERS';

    // Live closeness meter: non-linear so the top of the bar maps to the
    // PERFECT/CLOSE band you actually care about, with a live tier readout.
    this.zoneEl.classList.toggle('on', rs.zoneLive.active);
    if (rs.zoneLive.active) {
      const cl = rs.zoneLive.closeness;
      this.zoneFill.style.width = `${Math.round(Math.pow(cl, 3) * 100)}%`;
      const tier = cl >= 0.906 ? 'PERFECT' : cl >= 0.72 ? 'CLOSE' : 'SAFE';
      this.zoneLabel.textContent = tier;
      this.zoneEl.dataset.tier = tier.toLowerCase();
    }

    // sense of speed: a vignette that tightens as you go fast
    if (this.vignette) this.vignette.style.opacity = Math.min(0.55, Math.max(0, (rs.car.speed - 18) / 70));

    this.cpEl.textContent = (rs.totalLaps > 1 ? `LAP ${rs.lap}/${rs.totalLaps} · ` : '')
      + `CP ${rs.cpCount}/${rs.track.cps.length}`;

    if (rs.phase === 'countdown') {
      const n = Math.ceil(rs.countdown / (rs.t.countdownTicks / 3));
      const txt = n > 0 ? String(n) : '';
      if (txt !== this._cdText) {           // re-trigger the pulse on each beat
        this._cdText = txt;
        this.countdownEl.textContent = txt;
        this.countdownEl.style.animation = 'none';
        void this.countdownEl.offsetWidth;
        this.countdownEl.style.animation = '';
      }
      this.countdownEl.style.display = 'block';
    } else if (this.countdownEl.style.display !== 'none') {
      if (this._cdText !== 'GO') {
        this._cdText = 'GO';
        this.countdownEl.textContent = 'GO';
        this.countdownEl.style.animation = 'none';
        void this.countdownEl.offsetWidth;
        this.countdownEl.style.animation = '';
      }
      clearTimeout(this._goT);
      this._goT = setTimeout(() => { this.countdownEl.style.display = 'none'; }, 550);
      this.countdownEl.style.display = 'block';
    }

    if (this.splitTimer > 0 && (this.splitTimer -= 1 / 60) <= 0) this.splitEl.classList.remove('show');
  }

  popup(text, cls) {
    const el = document.createElement('div');
    el.className = `popup ${cls || ''}`;
    el.textContent = text;
    this.popupsEl.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  // splitIndex is a global 1-based counter across all laps, so PB deltas line
  // up even on multi-lap races; label is the human-readable lap/checkpoint tag.
  split(splitIndex, ticks, pbSplits, label) {
    let txt = `${label} — ${fmtTime(ticksToMs(ticks))}`;
    let cls = '';
    if (pbSplits && pbSplits[splitIndex - 1] != null) {
      const d = ticksToMs(ticks - pbSplits[splitIndex - 1]);
      txt += `  ${d >= 0 ? '+' : '−'}${fmtTime(Math.abs(d)).replace(/^00:/, '')}`;
      cls = d <= 0 ? 'ahead' : 'behind';
    }
    this.splitEl.textContent = txt;
    this.splitEl.className = `show ${cls}`;
    this.splitTimer = 2.2;
  }

  // pre-race coaching banner (the per-map tutorial line) — auto-hides
  coach(text) {
    if (!this.coachEl) return;
    this.coachEl.textContent = text;
    this.coachEl.classList.add('show');
    clearTimeout(this._coachT);
    this._coachT = setTimeout(() => this.coachEl.classList.remove('show'), 6500);
  }

  reset() {
    this.countdownEl.style.display = 'none';
    this._cdText = null;
    clearTimeout(this._goT);
    this.popupsEl.innerHTML = '';
    this.splitEl.classList.remove('show');
  }
}
