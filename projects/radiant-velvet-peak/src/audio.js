// Wall Hugger — synthesized audio (PRD §8.2). No assets; everything is WebAudio.

export class GameAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensure() {
    if (this.ctx || !this.enabled) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(c.destination);

    // engine: saw -> lowpass, pitch mapped to speed
    this.engOsc = c.createOscillator();
    this.engOsc.type = 'sawtooth';
    this.engFilter = c.createBiquadFilter();
    this.engFilter.type = 'lowpass';
    this.engFilter.frequency.value = 700;
    this.engGain = c.createGain();
    this.engGain.gain.value = 0;
    this.engOsc.connect(this.engFilter).connect(this.engGain).connect(this.master);
    this.engOsc.start();

    // ERS deploy layer: rising whine
    this.ersOsc = c.createOscillator();
    this.ersOsc.type = 'sine';
    this.ersGain = c.createGain();
    this.ersGain.gain.value = 0;
    this.ersOsc.connect(this.ersGain).connect(this.master);
    this.ersOsc.start();

    // zone proximity hum: tremolo whose rate rises with closeness
    this.proxOsc = c.createOscillator();
    this.proxOsc.type = 'triangle';
    this.proxOsc.frequency.value = 1500;
    this.proxLfo = c.createOscillator();
    this.proxLfo.frequency.value = 6;
    this.proxLfoGain = c.createGain();
    this.proxLfoGain.gain.value = 0;
    this.proxGain = c.createGain();
    this.proxGain.gain.value = 0;
    this.proxLfo.connect(this.proxLfoGain).connect(this.proxGain.gain);
    this.proxOsc.connect(this.proxGain).connect(this.master);
    this.proxOsc.start();
    this.proxLfo.start();

    // skid: looped noise -> bandpass
    const len = c.sampleRate * 0.5;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.skidSrc = c.createBufferSource();
    this.skidSrc.buffer = buf;
    this.skidSrc.loop = true;
    this.skidFilter = c.createBiquadFilter();
    this.skidFilter.type = 'bandpass';
    this.skidFilter.frequency.value = 900;
    this.skidGain = c.createGain();
    this.skidGain.gain.value = 0;
    this.skidSrc.connect(this.skidFilter).connect(this.skidGain).connect(this.master);
    this.skidSrc.start();

    // wall scrape: the same noise through a higher, harsher bandpass
    this.scrapeSrc = c.createBufferSource();
    this.scrapeSrc.buffer = buf;
    this.scrapeSrc.loop = true;
    this.scrapeFilter = c.createBiquadFilter();
    this.scrapeFilter.type = 'bandpass';
    this.scrapeFilter.frequency.value = 2600;
    this.scrapeFilter.Q.value = 0.8;
    this.scrapeGain = c.createGain();
    this.scrapeGain.gain.value = 0;
    this.scrapeSrc.connect(this.scrapeFilter).connect(this.scrapeGain).connect(this.master);
    this.scrapeSrc.start();
    this._wasDeploying = false;
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on && this.ctx) { this.ctx.close(); this.ctx = null; }
  }

  // called every frame with live state
  update({ speed = 0, racing = false, deploying = false, closeness = 0, inZone = false, slip = 0, contact = false, impact = 0, surface = 'asphalt' }) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const sp01 = Math.min(speed / 60, 1.2);
    const dirt = surface === 'dirt';
    this.engGain.gain.setTargetAtTime(racing ? 0.10 : 0, t, 0.08);
    this.engOsc.frequency.setTargetAtTime(55 + sp01 * 230 + (deploying ? 30 : 0), t, 0.05);
    // dirt drops the filter for a grittier, throatier note
    this.engFilter.frequency.setTargetAtTime((dirt ? 300 : 450) + sp01 * (dirt ? 900 : 1500), t, 0.08);

    // deploy whoosh on the rising edge so spending ERS has an onset, not a hum
    if (deploying && !this._wasDeploying) this.blip(520, 0.22, 'sawtooth', 0.12);
    this._wasDeploying = deploying;
    this.ersGain.gain.setTargetAtTime(deploying ? 0.08 : 0, t, 0.05);
    this.ersOsc.frequency.setTargetAtTime(640 + sp01 * 900, t, 0.05);

    // proximity hum: more present as you near the wall, so closeness is audible
    const px = inZone ? 0.07 + closeness * 0.14 : 0;
    this.proxGain.gain.setTargetAtTime(px * 0.5, t, 0.04);
    this.proxLfoGain.gain.setTargetAtTime(px, t, 0.04);
    this.proxLfo.frequency.setTargetAtTime(4 + closeness * 30, t, 0.05);
    this.proxOsc.frequency.setTargetAtTime(1100 + closeness * 900, t, 0.05);

    this.skidGain.gain.setTargetAtTime(Math.min(slip / 14, 1) * 0.12, t, 0.06);
    // scrape rides on wall contact, louder with impact speed
    this.scrapeGain.gain.setTargetAtTime(contact ? Math.min(0.04 + impact * 0.02, 0.22) : 0, t, 0.02);
    this.scrapeFilter.frequency.setTargetAtTime(2200 + Math.min(speed, 40) * 30, t, 0.05);
  }

  blip(freq, dur = 0.1, type = 'square', gain = 0.18, when = 0) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  beep(n) { this.blip(n === 1 ? 540 : 440, 0.12); }
  go() { this.blip(880, 0.3); }
  checkpoint() { this.blip(660, 0.08, 'sine', 0.2); this.blip(990, 0.12, 'sine', 0.2, 0.07); }
  // a rising two-note "lock-on" the instant the car enters a hug zone
  zoneEnter() { this.blip(700, 0.06, 'sine', 0.12); this.blip(1050, 0.08, 'sine', 0.12, 0.05); }
  // longer, richer fanfare the better the medal; bronze is a plain chime
  finishChime(medal) {
    const sets = {
      author: [523, 659, 784, 1047, 1319],
      gold: [523, 659, 784, 1047],
      silver: [523, 659, 784],
      bronze: [523, 659],
    };
    const notes = sets[medal] || [660, 880, 1100, 1320];
    notes.forEach((f, i) => this.blip(f, 0.22, 'sine', 0.18, i * 0.1));
    if (medal === 'author' || medal === 'gold') { // add a shimmer layer
      notes.forEach((f, i) => this.blip(f * 2, 0.18, 'triangle', 0.06, i * 0.1 + 0.02));
    }
  }
  award(rating) {
    const f = rating === 'PERFECT' ? 1400 : rating === 'CLOSE' ? 1100 : 850;
    this.blip(f, 0.1, 'sine', 0.22);
    if (rating === 'PERFECT') this.blip(f * 1.5, 0.14, 'sine', 0.18, 0.06);
  }
  voidBuzz() { this.blip(110, 0.25, 'sawtooth', 0.22); }
  click() { this.blip(2000, 0.03, 'square', 0.08); }
}
