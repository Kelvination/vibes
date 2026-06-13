// Wall Hugger — all handling/feel constants in one place (PRD §4.6).
// Everything numeric here is exposed in the F2 debug tuning panel.
//
// The car is a planar rigid body driven by a raycast-suspension / bicycle
// tire model: per-axle normal load comes from a spring-damper suspension with
// longitudinal weight transfer, and lateral grip is generated from slip angles
// and bounded by a per-axle friction circle. Understeer, brake-induced
// rotation and power-on oversteer all emerge from the forces — they are not
// scripted. See sim.js step().

export const TUNING = {
  // Simulation
  dt: 0.01,              // fixed 100 Hz timestep (s)
  countdownTicks: 180,   // 3 beeps * 0.6 s

  // Car body — collision is a capsule (two circles along the length) so the
  // hitbox matches the visible chassis (1.9 wide × 4.2 long): the nose/tail no
  // longer poke through walls, and the sides touch exactly at the body edge.
  carColRadius: 0.95,    // capsule radius = body half-width (m)
  carColOffset: 1.15,    // capsule end offset fwd/back from CG (reach = 2.1 m)
  carHalfWidth: 0.95,    // used for wall-face distance (zone scoring)

  // Chassis / mass properties. CG is biased rearward (lf > lr) so the car
  // carries a touch of stabilising understeer; trail-braking still rotates it.
  mass: 1100,            // kg
  gravity: 9.81,         // m/s^2
  Iz: 1700,              // yaw moment of inertia (kg m^2)
  lf: 1.45,              // CG -> front axle (m)
  lr: 1.15,              // CG -> rear axle (m)
  hcg: 0.5,              // CG height — drives longitudinal weight transfer (m)

  // Engine / longitudinal (forces in N; grip-limited by the tires). Top speed
  // emerges from the drag balance; ERS/throttle add force, not a scripted cap.
  engineForce: 9000,     // rear-axle drive force at full throttle (N)
  topSpeed: 52,          // soft drag ceiling (m/s) before surface/ERS multipliers
  brakeForce: 13000,     // total brake force (N), split by brakeBias
  brakeBias: 0.62,       // fraction of brake force on the front axle
  reverseForce: 4000,    // reverse drive force (N)
  reverseTop: 11,        // max reverse speed (m/s)
  reverseThresh: 1.6,    // below this fwd speed, brake becomes reverse (m/s)
  rollK: 0.014,          // rolling resistance (1/s on vF)
  dragK: 0.0033,         // quadratic aero drag — sets the natural top speed

  // Tires
  baseMu: 1.5,           // asphalt friction coefficient (scaled by surface)
  corneringStiff: 6.5,   // lateral stiffness per unit normal load (1/rad)
  lowSpeedRef: 3.0,      // m/s — tire forces fade in below this (kills jitter)
  yawDamp: 1700,         // yaw-rate damping torque coefficient (N m s/rad)

  // Steering (PRD §9: digital input smoothed to analog)
  maxSteerAngle: 0.50,   // max front wheel angle at low speed (rad ~ 29 deg)
  steerSpeedK: 0.08,     // steer lock shrinks with speed: angle /= 1 + k*speed
  steerRate: 6.0,        // input ramp 0 -> 1 (1/s) — weightier than instant
  recenterRate: 12.0,    // faster re-center on release

  // Suspension visuals (spring-damper, render-only body lean/dive/squat)
  susStiff: 230,         // spring constant toward the load-transfer target
  susDamp: 17,           // damping (slightly underdamped -> a little bounce)
  susPitchGain: 0.0065,  // rad of dive/squat per m/s^2 of longitudinal accel
  susRollGain: 0.0072,   // rad of body roll per m/s^2 of lateral accel
  susHeaveGain: 0.0035,  // m of heave per m/s^2 of combined accel

  // Surfaces (PRD §4.5) — grip scales tire mu, power scales drive, top scales cap
  surfaces: {
    asphalt: { grip: 1.0,  power: 1.0,  top: 1.0 },
    dirt:    { grip: 0.42, power: 0.85, top: 0.80 },
    grass:   { grip: 0.55, power: 0.40, top: 0.42 },
    boost:   { grip: 1.0,  power: 1.0,  top: 1.0 },
  },
  boostAccel: 13,        // booster pad forced acceleration (m/s^2)

  // Walls
  wallHalf: 0.25,        // wall render half-thickness — collide at the visible
                         // inner face, not the centerline, so the car body
                         // stops flush with the wall instead of sinking in
  wallRestitution: 0.08,
  wallFrictionK: 0.55,   // tangential scrub scaled by normal impact
  wallYawDamp: 0.85,     // yaw damping on contact

  // ERS (PRD §5) — passive "always-on" boost. Wall hugging charges the bar;
  // the bar then continuously scales engine power and top speed (no deploy
  // button) and bleeds off over time, so you stay fast by keeping it topped up.
  ersCap: 100,
  ersPassivePower: 0.24, // +24% engine force at a full bar (scales with charge)
  ersPassiveTop: 0.13,   // +13% top speed at a full bar
  ersDecay: 5.5,         // bar bleeds per second -> full bar fades in ~18 s

  // Hug zones (PRD §5.1)
  zoneBand: 3.2,         // charge band from wall face (~1.5 car widths)
  zoneMax: 23,           // perfect pass award (% of bar)
  zoneCurveExp: 2.6,     // steep near the wall
  zoneSpeedRef: 21,      // full speed credit at/above this (m/s)
  zonePerfect: 0.30,     // minDist thresholds for ratings (m)
  zoneClose: 1.15,
};

export function ratingFor(minDist) {
  if (minDist <= TUNING.zonePerfect) return 'PERFECT';
  if (minDist <= TUNING.zoneClose) return 'CLOSE';
  return 'SAFE';
}

export function zoneAward(minDist, speedAtMin) {
  const t = TUNING;
  const d = Math.min(Math.max(minDist, 0), t.zoneBand);
  const closeness = 1 - d / t.zoneBand;
  const speedF = Math.pow(Math.min(speedAtMin / t.zoneSpeedRef, 1), 0.7);
  return t.zoneMax * Math.pow(closeness, t.zoneCurveExp) * speedF;
}
