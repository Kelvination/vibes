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
    authorTime: 45135,
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
    authorTime: 52707,
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
    authorTime: 56810,
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
    authorTime: 155995,
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
    authorTime: 138331,
    build() {
      const pb = new PathBuilder(6, 4, 0);
      pb.start().s(3).hug().hug().R(2).boost().s(1).L().s(1).R().cp()
        .hug().hug().s(1).R().s(2).R().s(1).L().dirt(2).dR().dirt(1).dL()
        .cp().s(1).R().boost().hug().finish().L().R().R();
      return closed(pb, 6, 4);
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
