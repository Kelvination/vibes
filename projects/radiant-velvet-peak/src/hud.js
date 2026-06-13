// Wall Hugger — driving HUD (PRD §8.3). Plain DOM, updated per frame.

import { fmtTime, ticksToMs } from './sim.js';

const $ = (id) => document.getElementById(id);

export class Hud {
  constructor() {
    this.speedEl = $('hud-speed');
    this.timeEl = $('hud-time');
    this.ersFill = $('hud-ers-fill');
    this.ersBar = $('hud-ers');
    this.zoneEl = $('hud-zone');
    this.zoneFill = $('hud-zone-fill');
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
        `<span class="m-gold">● ${fmtTime(Math.round(map.authorTime * 1.06))}</span>` +
        `<span class="m-silver">● ${fmtTime(Math.round(map.authorTime * 1.20))}</span>` +
        `<span class="m-bronze">● ${fmtTime(Math.round(map.authorTime * 1.50))}</span>`;
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

    this.zoneEl.classList.toggle('on', rs.zoneLive.active);
    if (rs.zoneLive.active) this.zoneFill.style.width = `${Math.round(rs.zoneLive.closeness * 100)}%`;

    this.cpEl.textContent = `CP ${rs.cpCount}/${rs.track.cps.length}`;

    if (rs.phase === 'countdown') {
      const n = Math.ceil(rs.countdown / (rs.t.countdownTicks / 3));
      this.countdownEl.textContent = n > 0 ? n : '';
      this.countdownEl.style.display = 'block';
    } else if (this.countdownEl.style.display !== 'none') {
      this.countdownEl.textContent = 'GO';
      setTimeout(() => { this.countdownEl.style.display = 'none'; }, 450);
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

  split(index, total, ticks, pbSplits) {
    let txt = `CP ${index}/${total} — ${fmtTime(ticksToMs(ticks))}`;
    let cls = '';
    if (pbSplits && pbSplits[index - 1] != null) {
      const d = ticksToMs(ticks - pbSplits[index - 1]);
      txt += `  ${d >= 0 ? '+' : '−'}${fmtTime(Math.abs(d)).replace(/^00:/, '')}`;
      cls = d <= 0 ? 'ahead' : 'behind';
    }
    this.splitEl.textContent = txt;
    this.splitEl.className = `show ${cls}`;
    this.splitTimer = 2.2;
  }

  reset() {
    this.countdownEl.style.display = 'none';
    this.popupsEl.innerHTML = '';
    this.splitEl.classList.remove('show');
  }
}
