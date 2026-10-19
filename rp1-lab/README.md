# XUNIA // RoboParty RP1 Simulation Lab

This folder is a **free, static, simulation-only proof of concept**. Open `rp1-lab/index.html` from an HTTP static server (or the GitHub Pages site after an administrator enables publishing).

## Included
- Procedural, articulated **RP1-inspired** humanoid in Three.js. It is an original visualization, not RoboParty's CAD/mesh/URDF or a physics-valid digital twin.
- Fictional non-kinetic disaster response, infrastructure inspection and maritime aid routes.
- Repeatable waypoint state machine, generated battery and motion telemetry, mission audit trail, visual pose demonstrations, speed adjustment, wireframe mode, responsive mobile UI.
- Latched **simulation** stop and JSON export with explicit provenance. This is not a hardware-rated emergency stop.
- No actuator commands, live robot connection, ROS control, camera acquisition, military systems link, AI/cloud inference, subscription or paid API.

## Run
```sh
python3 -m http.server 8000
```
Open http://localhost:8000/rp1-lab/ (internet access required for the pinned free Three.js CDN). There is no build step.

## Verify
```sh
node --test rp1-lab/tests/sim.test.mjs
node --test vehicle-hangar/tests/smoke.test.mjs
node --check rp1-lab/app.mjs
```
CI: `.github/workflows/rp1-lab-verify.yml`. Browser rendering and mobile/device QA require a real browser. Passing unit tests does not imply hardware accuracy, dynamics validation or field readiness.

## Official RoboParty resources (independent)
- https://github.com/Roboparty/RP1
- https://github.com/Roboparty/rp1_description (URDF, MJCF, mesh description)
- https://github.com/Roboparty/roboparty_deploy (ROS 2 deployment framework, motor/IMU/policy examples)

RoboParty components are **not copied or redistributed** here. Upstream license and hardware safety constraints must be reviewed separately before any hardware integration.

## XUNIA Museum entry
**Title:** XUNIA RoboParty RP1 Simulation Lab
**Status:** software proof-of-concept; field/hardware validation blocked
**Category:** Robotics / humanoids / mission visualization
**Demo:** `/rp1-lab/`
**Source:** `sonoxo/roboparty_build/rp1-lab`
**Safety:** synthetic data; no physical device control
**Evidence:** run `node --test rp1-lab/tests/sim.test.mjs` and retain CI logs and commit SHA.
