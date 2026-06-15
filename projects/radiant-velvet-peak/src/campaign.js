// Wall Hugger — bundled campaign maps (PRD §6.3): teach mechanics progressively.
// Maps are authored with PathBuilder so block connectivity is guaranteed;
// each build asserts the loop closes back onto the start cell.
// authorTime values come from tools/measure.mjs (autopilot run × 0.92).

import { PathBuilder } from './blocks.js';

function closed(pb, sx, sz) {
  if (pb.head.x !== sx || pb.head.z !== sz || pb.dir !== 0) {
    throw new Error(`Campaign map does not close: head ${pb.head.x},${pb.head.z} dir ${pb.dir}`);
  }
  return pb.list;
}

export const CAMPAIGN = [
  {
    id: 'c01',
    name: '01 — First Steps',
    desc: 'A gentle three-lap shakedown. Learn the racing line: enter corners wide along the outer wall, clip the glowing apex zone on the inside, exit wide again. The closer you skim, the more ERS you bank — touching voids the zone.',
    laps: 3,
    authorTime: 68439,
    build() {
      const pb = new PathBuilder(10, 10, 0);
      pb.start().s(4).R().s(2).R().cp().s(2).cp().s(1).R().s(1).finish().R();
      return closed(pb, 10, 10);
    },
  },
  {
    id: 'c02',
    name: '02 — Brake to Turn',
    desc: 'Chicanes and hairpins over two laps. Full throttle will not make these corners — brake while turning and the rear rotates you in. Catch it with counter-steer.',
    laps: 2,
    authorTime: 78439,
    build() {
      const pb = new PathBuilder(8, 8, 0);
      pb.start().s(3).R().s(1).L().R().cp().s(2).R().s(1).R().s(1).L().s(1).L()
        .s(1).R().s(1).R().s(3).cp().finish().R();
      return closed(pb, 8, 8);
    },
  },
  {
    id: 'c03',
    name: '03 — Millimeters',
    desc: 'Hug roads and boosters over three laps. The straights are lined with charge walls: thread them at speed for PERFECT awards, then deploy everything you banked.',
    laps: 3,
    authorTime: 60821,
    build() {
      const pb = new PathBuilder(6, 6, 0);
      pb.start().hug().hug().hug().s(1).R(2).boost().hug().hug().cp().s(1)
        .R().s(6).R().boost().hug().hug().cp().finish().s(1).R();
      return closed(pb, 6, 6);
    },
  },
  {
    id: 'c04',
    name: '04 — Dust & Drift',
    desc: 'Three laps on mixed surfaces. Dirt has less grip, less speed, and loves to rotate. Slide the dirt esses, then get back on clean asphalt for the run home.',
    laps: 3,
    authorTime: 114871,
    build() {
      const pb = new PathBuilder(7, 7, 0);
      pb.start().s(2).R().dirt(2).dR().dirt(1).dL().dirt(1).cp().R().cp()
        .R().dirt(2).dL().dR().dirt(1).finish().R().s(1);
      return closed(pb, 7, 7);
    },
  },
  {
    id: 'c05',
    name: '05 — Velvet Peak GP',
    desc: 'A two-lap grand prix with everything at once: sweepers, hug straights, boosters, a dirt sector and a tight finale. The fastest line almost touches the wall.',
    laps: 2,
    authorTime: 115331,
    build() {
      const pb = new PathBuilder(6, 4, 0);
      pb.start().s(3).hug().hug().R(2).boost().s(1).L().s(1).R().cp()
        .hug().hug().s(1).R().s(2).R().s(1).L().dirt(2).dR().dirt(1).dL()
        .cp().s(1).R().boost().hug().finish().L().R().R();
      return closed(pb, 6, 4);
    },
  },
  {
    id: 'c06',
    name: '06 — Ribbon Run',
    desc: 'A long flowing rectangle over three laps — both long sides are charge walls. Settle into a rhythm and milk every straight: hug the wall, bank ERS, carry the passive boost into the next corner.',
    laps: 3,
    authorTime: 52826,
    build() {
      const pb = new PathBuilder(8, 8, 0);
      pb.start()
        .hug().hug().s(1).R()
        .cp().s(1).boost().s(1).s(1).R()
        .hug().hug().s(1).cp().R()
        .s(1).s(1).finish().s(1).s(1).R();
      return closed(pb, 8, 8);
    },
  },
  {
    id: 'c07',
    name: '07 — Quarry Drift',
    desc: 'Two laps with a loose dirt sector slung between two dirt hairpins. Pitch the car in early, let it rotate, and feed the throttle on exit — then hook back up on clean asphalt for the boosted run home.',
    laps: 2,
    authorTime: 69543,
    build() {
      const pb = new PathBuilder(9, 9, 0);
      pb.start()
        .s(1).cp().s(1).R()
        .boost().s(1).s(1).s(1).dR()
        .dirt(1).dirt(1).dirt(1).cp().dR()
        .dirt(1).s(1).finish().s(1).R();
      return closed(pb, 9, 9);
    },
  },
  {
    id: 'c08',
    name: '08 — The Notch',
    desc: 'A tight loop with a concave notch — a quick right-left flick mid-lap that breaks the rhythm. Two laps. Brake-rotate the notch, catch it, and stay off the walls through the kink.',
    laps: 2,
    authorTime: 38152,
    build() {
      const pb = new PathBuilder(10, 12, 0);
      pb.start().cp().R()
        .hug().hug().s(1).R()
        .s(1).cp().s(1).R()
        .s(1).L()
        .s(1).R()
        .s(1).R()
        .s(1).finish().s(1);
      return closed(pb, 10, 12);
    },
  },
  {
    id: 'c09',
    name: '09 — Apex Stadium',
    desc: 'A fast flowing oval with wide medium-radius ends — carry speed, stay smooth, and trail the outer wall through the long curves to keep the ERS bar topped up.',
    laps: 3,
    authorTime: 35374,
    build() {
      const pb = new PathBuilder(9, 9, 0);
      pb.start().hug().hug().s(1).cp()
        .R(2).R(2)
        .boost().s(1).hug().cp().finish()
        .R(2).R(2);
      return closed(pb, 9, 9);
    },
  },
  {
    id: 'c10',
    name: '10 — Velocity Sweep',
    desc: 'Two enormous full-throttle sweepers joined by short chutes. The line is everything: hold the longest radius you can and let the passive boost build through the bend.',
    laps: 3,
    authorTime: 33828,
    build() {
      const pb = new PathBuilder(8, 12, 0);
      pb.start().hug().cp()
        .R(3).R(3)
        .cp().hug().finish()
        .R(3).R(3);
      return closed(pb, 8, 12);
    },
  },
  {
    id: 'c11',
    name: '11 — Twin Sweeps',
    desc: 'A grand-prix rhythm: two sweeping ends linked by tight-corner chicanes and hug straights. Brake deep for the tight ones, then unwind onto the fast curves.',
    laps: 2,
    authorTime: 30792,
    build() {
      const pb = new PathBuilder(8, 8, 0);
      pb.start().hug().hug().cp().R(2)
        .s(1).boost().s(1).s(1).R()
        .hug().hug().s(1).cp().R(2)
        .s(1).finish().s(1).s(1).R();
      return closed(pb, 8, 8);
    },
  },
  {
    id: 'c12',
    name: '12 — The Long Esses',
    desc: 'The fastest layout in the set — vast curve-three sweepers at both ends with hug straights down the sides. A momentum circuit: protect your speed and never scrub the walls.',
    laps: 2,
    authorTime: 35972,
    build() {
      const pb = new PathBuilder(8, 8, 0);
      pb.start().hug().hug().s(1).cp().R(3)
        .s(1).boost().s(1).hug().hug().R()
        .hug().hug().s(1).s(1).cp().R(3)
        .s(1).finish().s(1).s(1).s(1).R();
      return closed(pb, 8, 8);
    },
  },
];

export function campaignMap(id) {
  const m = CAMPAIGN.find((c) => c.id === id);
  if (!m) return null;
  return {
    key: `campaign:${m.id}`,
    name: m.name,
    desc: m.desc,
    authorTime: m.authorTime,
    laps: m.laps || 1,
    placements: m.build(),
    campaign: true,
  };
}
