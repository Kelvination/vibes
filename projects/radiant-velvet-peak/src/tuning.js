// WallRush — all handling/feel constants in one place (PRD §4.6).
// Everything numeric here is exposed in the F2 debug tuning panel.

export const TUNING = {
  // Simulation
  dt: 0.01,              // fixed 100 Hz timestep (s)
  countdownTicks: 180,   // 3 beeps * 0.6 s

  // Car body
  carRadius: 1.05,       // collision circle radius (m)
  carHalfWidth: 0.95,    // used for wall-face distance (zone scoring)

  // Engine / longitudinal
  enginePower: 24,       // accel at standstill (m/s^2)
  topSpeed: 58,          // soft cap (m/s) before surface/ERS multipliers
  brakeDecel: 30,        // braking deceleration (m/s^2)
  reverseTop: 11,        // max reverse speed (m/s)
  reverseThresh: 1.6,    // below this fwd speed, brake becomes reverse (m/s)
  rollK: 0.22,           // rolling resistance (1/s on vF)
  dragK: 0.0009,         // quadratic drag

  // Steering (PRD §9: digital input smoothed to analog)
  steerRate: 9.0,        // ramp 0 -> 1 in ~110 ms
  recenterRate: 15.0,    // faster re-center on release

  // Yaw / understeer (PRD §4.2)
  baseYaw: 2.5,          // max yaw rate at standstill (rad/s)
  yawSpeedK: 0.046,      // maxYaw = baseYaw / (1 + k * vF)
  yawResp: 10.0,         // first-order response toward target yaw (1/s)

  // Lateral grip (PRD §4.1) — bleed of lateral velocity per second
  baseGrip: 9.0,
  gripSpeedK: 0.016,     // grip fades with speed -> progressive washout

  // Brake-induced rotation (PRD §4.3)
  brakeRotMinYaw: 0.14,  // need existing rotation (rad/s)
  brakeRotMinSpeed: 8,   // need speed (m/s)
  brakeRotGain: 1.9,     // yaw amplification while braking (1/s, exponential)
  brakeRotCap: 2.3,      // yaw rate never exceeds this while sliding (rad/s)
  brakeRotGripMul: 0.30, // rear grip multiplier during brake-drift
  brakeRotScrub: 0.55,   // extra fwd speed bleed scaled by |yawRate| (1/s)

  // Surfaces (PRD §4.5)
  surfaces: {
    asphalt: { grip: 1.0,  power: 1.0,  top: 1.0 },
    dirt:    { grip: 0.42, power: 0.85, top: 0.80 },
    grass:   { grip: 0.55, power: 0.40, top: 0.42 },
    boost:   { grip: 1.0,  power: 1.0,  top: 1.0 },
  },
  boostAccel: 40,        // booster pad forced acceleration (m/s^2)

  // Walls
  wallRestitution: 0.08,
  wallFrictionK: 0.55,   // tangential scrub scaled by normal impact
  wallYawDamp: 0.85,     // yaw damping on contact

  // ERS (PRD §5)
  ersCap: 100,
  ersDrain: 19,          // per second -> full bar ~5.3 s
  ersPowerMul: 1.27,     // sustained shove, not a turbo spike
  ersTopMul: 1.11,

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
