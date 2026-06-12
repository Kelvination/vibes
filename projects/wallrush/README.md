# WallRush

A browser-based, Trackmania-style time-trial racing game with a twist: hugging designated wall zones at corner entries, apexes, and exits charges an ERS-style energy reserve you can deploy (hold or toggle) for sustained extra engine power. Touching the wall gives nothing — only a clean near-miss charges.

**Status:** PRD stage — see [PRD.md](./PRD.md) for the full product requirements document.

## Key pillars

- Trackmania-like arcade handling: speed-sensitive understeer, controllable brake-induced rotation, instant restarts
- Hug-zone ERS: marked wall segments on corner entry/apex/exit charge energy by proximity (contact = zero); deploy for a sustained power increase (F1 ERS style, not a turbo spike)
- Block-based map builder with a Trackmania-style block catalog (roads, banked curves, ramps, loops, wallrides, dirt, boosters)
- Local PBs, medals, and deterministic ghost replays; maps shareable via export codes
