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
  reverseThresh: 0.9,    // below this fwd speed, brake becomes reverse (m/s) —
                         // low so braking-to-settle against a wall won't reverse
  rollK: 0.014,          // rolling resistance (1/s on vF)
  dragK: 0.0033,         // quadratic aero drag — sets the natural top speed

  // Tires
  baseMu: 1.5,           // asphalt friction coefficient (scaled by surface)
  corneringStiff: 6.5,   // lateral stiffness per unit normal load (1/rad)
  lowSpeedRef: 3.0,      // m/s — tire forces fade in below this (kills jitter)
  yawDamp: 1700,         // yaw-rate damping torque coefficient (N m s/rad)

  // Handbrake (Space): locks the rear, cutting its lateral grip so the back
  // steps out for a tight apex clip — the rotation tool that pairs with hugging.
  handbrakeGrip: 0.38,   // rear lateral grip multiplier while held
  handbrakeBrake: 0.5,   // rear brake force as a fraction of brakeForce

  // Steering (PRD §9: digital input smoothed to analog)
  maxSteerAngle: 0.50,   // max front wheel angle at low speed (rad ~ 29 deg)
  steerSpeedK: 0.055,    // steer lock shrinks with speed: angle /= 1 + k*speed
  steerRate: 8.5,        // input ramp 0 -> 1 (1/s) — crisp but not instant
  recenterRate: 14.0,    // faster re-center on release

  // Slide recovery (arcade catch assist). A raycast/bicycle car saturates at
  // high slip and won't self-straighten from a big slide, so two assists ramp
  // in with sideslip — both ~0 in normal driving and small drifts, so it stays
  // skill-expressive, but a 45–90° slide becomes catchable instead of a spin:
  //   1) steering lock is restored so you have the counter-steer range, and
  //   2) a restoring yaw moment nudges the nose back toward the travel vector.
  counterSteerBoost: 1.2,  // extra steer lock (×) ramped in by full sideslip
  assistMinSlip: 0.45,     // rad (~26°): yaw assist starts above this slip
  assistFullSlip: 1.05,    // rad (~60°): assists fully ramped in here
  assistYaw: 100,          // restoring yaw moment per m/s of speed (N·m·s/m)
  assistVRef: 32,          // speed (m/s) at which the yaw assist saturates

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
    grass:   { grip: 0.72, power: 0.62, top: 0.60 }, // a deterrent, not a trap
    boost:   { grip: 1.0,  power: 1.0,  top: 1.0 },
  },
  boostAccel: 13,        // booster pad forced acceleration (m/s^2)

  // Walls
  wallHalf: 0.25,        // wall render half-thickness — collide at the visible
                         // inner face, not the centerline, so the car body
                         // stops flush with the wall instead of sinking in
  wallRestitution: 0.08,
  wallFrictionK: 0.95,   // tangential scrub scaled by normal impact — a real
                         // hit bites, so a clean hug and a crash feel different
  wallScrubMax: 0.5,     // cap on per-contact tangential speed scrub
  wallYawDamp: 0.85,     // yaw damping on contact

  // ERS (PRD §5) — player-deployed boost. Wall hugging charges the bar; the
  // player spends it with Shift (hold) or E (toggle) for a sustained engine
  // shove that drains the bar. A slow idle bleed keeps it from being hoarded.
  ersCap: 100,
  ersPassivePower: 0.35, // +35% engine force while deploying a full bar
  ersPassiveTop: 0.18,   // +18% top speed while deploying
  ersDeployDrain: 20,    // bar spent per second of deploy -> full bar in ~5 s
  ersDecay: 1.2,         // slow idle bleed when not deploying

  // Hug zones (PRD §5.1)
  zoneBand: 3.2,         // charge band from wall face (~1.5 car widths)
  zoneMax: 26,           // perfect pass award (% of bar)
  zoneCurveExp: 2.6,     // steep near the wall
  zoneSpeedRef: 25,      // full speed credit at/above this (m/s)
  zoneSpeedExp: 1.4,     // steep so slow, timid hugging pays much less
  zonePerfect: 0.30,     // minDist thresholds for ratings (m)
  zoneClose: 0.9,
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
  const speedF = Math.pow(Math.min(speedAtMin / t.zoneSpeedRef, 1), t.zoneSpeedExp);
  return t.zoneMax * Math.pow(closeness, t.zoneCurveExp) * speedF;
}
