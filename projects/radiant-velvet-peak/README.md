# WallRush

A browser-based, Trackmania-style time-trial racing game with a twist: hugging designated wall zones at corner entries, apexes, and exits charges an ERS-style energy reserve you can deploy (hold or toggle) for sustained extra engine power. Touching the wall voids the zone — only a clean near-miss pays.

**Status:** PRD stage — see [PRD.md](./PRD.md) for the full product requirements document. This project folder is being repurposed for WallRush; the files currently deployed (`index.html`, `game.js`, `style.css`) are the previous **3D Raycast Car Physics** demo (Three.js raycast-wheel car sim), kept as reference code until the WallRush build replaces it.

## Key pillars

- Trackmania-like arcade handling: speed-sensitive understeer, controllable brake-induced rotation, instant restarts
- Hug-zone ERS: marked wall segments on corner entry/apex/exit, each a one-shot award per run scaled by closest approach (contact voids it); deploy for a sustained power increase (F1 ERS style, not a turbo spike)
- Block-based map builder with a Trackmania-style block catalog (roads, banked curves, ramps, loops, wallrides, dirt, boosters)
- Local PBs, medals, and deterministic ghost replays; maps shareable via export codes
