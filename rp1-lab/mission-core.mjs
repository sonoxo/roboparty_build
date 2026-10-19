/*
 * XUNIA / GPT-Doug RoboParty RP1-inspired Lab
 * Offline deterministic mission-state model. No hardware transport or commands.
 * MIT? The host repository retains its upstream licensing. See README.
 */
export const MODEL_VERSION = "1.0.0";
export const SIMULATION_ONLY = true;
export const SCENARIOS = Object.freeze({
  rescue: {
    name: "Disaster response",
    description: "Inspect simulated rubble, reach a medical relay, and confirm the evacuation route.",
    waypoints: [
      { label: "Rubble boundary", x: -3.8, z: 1.5, task: "Visual hazard survey" },
      { label: "Medical relay", x: -1.4, z: -3.1, task: "Confirm relief supplies" },
      { label: "Safe corridor", x: 2.7, z: -3.3, task: "Route inspection" },
      { label: "Evacuation marker", x: 4.4, z: 1.4, task: "Mark route clear" }
    ]
  },
  infrastructure: {
    name: "Infrastructure inspection",
    description: "Survey a synthetic data-center perimeter without touching real equipment.",
    waypoints: [
      { label: "Access boundary", x: -3.7, z: -2.5, task: "Read simulated sensor" },
      { label: "Cooling module", x: 0.7, z: -4.1, task: "Temperature check" },
      { label: "Power module", x: 3.9, z: -0.8, task: "Status inspection" },
      { label: "Handoff area", x: 1.7, z: 3.4, task: "Prepare maintenance report" }
    ]
  },
  maritime: {
    name: "Maritime aid exercise",
    description: "A fictional dockside humanitarian-relief walkthrough.",
    waypoints: [
      { label: "Pier access", x: -4.2, z: -1.7, task: "Check pier clearance" },
      { label: "Life-safety station", x: -1.2, z: 3.7, task: "Verify aid kit" },
      { label: "Observation marker", x: 2.4, z: 2.5, task: "Record simulated conditions" },
      { label: "Crew handoff", x: 4.3, z: -1.7, task: "Complete aid handoff" }
    ]
  }
});
const POSES = new Set(["neutral", "wave", "inspect", "reach"]);
const safeNumber = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const copy = (obj) => JSON.parse(JSON.stringify(obj));

export class RoboLabState {
  constructor(scenario = "rescue") {
    if (!(scenario in SCENARIOS)) throw new RangeError("Unknown scenario");
    this.scenario = scenario;
    this.reset();
  }

  record(code, message) {
    this.events.push({ t: Number(this.simSeconds.toFixed(2)), code, message, source: "synthetic-simulator" });
    if (this.events.length > 100) this.events.shift();
  }

  reset() {
    this.status = "idle";
    this.estopLatched = false;
    this.simSeconds = 0;
    this.stepIndex = 0;
    this.stepSeconds = 0;
    this.speed = 1;
    this.batteryPercent = 100;
    this.position = { x: 0, z: 0 };
    this.pose = "neutral";
    this.events = [];
    this.record("RESET", "Simulation reset; physical interfaces remain disconnected.");
    return this.snapshot();
  }

  selectScenario(key) {
    if (!(key in SCENARIOS)) throw new RangeError("Unknown scenario");
    this.scenario = key;
    this.reset();
    this.record("SCENARIO", "Selected " + SCENARIOS[key].name + ".");
    return this.snapshot();
  }

  setSpeed(value) {
    this.speed = clamp(safeNumber(value, 1), 0.5, 2);
    this.record("SPEED", "Simulation playback " + this.speed.toFixed(1) + "x.");
    return this.speed;
  }

  setPose(pose) {
    if (!POSES.has(pose) || this.status === "running" || this.estopLatched) return false;
    this.pose = pose;
    this.record("POSE", "Visual demo pose " + pose + ".");
    return true;
  }

  start() {
    if (this.estopLatched || this.status === "complete") return false;
    if (this.status !== "running") {
      this.status = "running";
      this.record("START", "Started virtual route; simulation-only.");
    }
    return true;
  }

  pause() {
    if (this.status !== "running") return false;
    this.status = "paused";
    this.record("PAUSE", "Paused synthetic route.");
    return true;
  }

  emergencyStop() {
    if (!this.estopLatched) {
      this.status = "estopped";
      this.estopLatched = true;
      this.pose = "neutral";
      this.record("ESTOP", "Simulation halted. Reset required to restart.");
    }
    return this.snapshot();
  }

  completeStep() {
    const route = SCENARIOS[this.scenario].waypoints;
    const waypoint = route[this.stepIndex];
    if (!waypoint) return;
    this.position = { x: waypoint.x, z: waypoint.z };
    this.record("CHECKPOINT", "Completed " + waypoint.label + ": " + waypoint.task + ".");
    this.stepIndex += 1;
    this.stepSeconds = 0;
    if (this.stepIndex === route.length) {
      this.status = "complete";
      this.pose = "neutral";
      this.record("COMPLETE", "Fictional mission complete; no physical action occurred.");
    }
  }

  // dt is frame time in seconds. Clamped to prevent giant tab-background jumps.
  tick(dt) {
    if (this.status !== "running") return this.snapshot();
    const seconds = clamp(safeNumber(dt, 0), 0, 0.25) * this.speed;
    if (seconds === 0) return this.snapshot();
    this.simSeconds += seconds;
    this.batteryPercent = Math.max(0, this.batteryPercent - seconds * 0.035);
    if (this.batteryPercent < 2) {
      this.emergencyStop();
      return this.snapshot();
    }
    this.stepSeconds += seconds;
    const route = SCENARIOS[this.scenario].waypoints;
    const target = route[this.stepIndex];
    const origin = this.stepIndex === 0 ? { x: 0, z: 0 } : route[this.stepIndex - 1];
    const factor = clamp(this.stepSeconds / 5.5, 0, 1);
    this.position = {
      x: origin.x + (target.x - origin.x) * factor,
      z: origin.z + (target.z - origin.z) * factor
    };
    if (factor >= 1) this.completeStep();
    return this.snapshot();
  }

  // Step-through provides a deliberate single-action demonstration while not running.
  step() {
    if (this.estopLatched || this.status === "running" || this.status === "complete") return false;
    this.completeStep();
    return true;
  }

  snapshot() {
    const route = SCENARIOS[this.scenario];
    return {
      schema: "xunia.roboparty.sim-telemetry.v1",
      modelVersion: MODEL_VERSION,
      provenance: "synthetic-simulator",
      hardwareConnected: false,
      hardwareCommandSupported: false,
      scenario: this.scenario,
      mission: route.name,
      status: this.status,
      estopLatched: this.estopLatched,
      simSeconds: Number(this.simSeconds.toFixed(2)),
      batteryPercent: Number(this.batteryPercent.toFixed(2)),
      speed: this.speed,
      pose: this.pose,
      position: { x: Number(this.position.x.toFixed(3)), z: Number(this.position.z.toFixed(3)) },
      stepIndex: this.stepIndex,
      totalSteps: route.waypoints.length,
      progressPercent: Math.round(100 * (this.stepIndex + (this.status === "running" ? this.stepSeconds / 5.5 : 0)) / route.waypoints.length),
      nextCheckpoint: route.waypoints[this.stepIndex]?.label || "None",
      tasks: copy(route.waypoints),
      events: copy(this.events)
    };
  }

  exportTrace() {
    return JSON.stringify({
      ...this.snapshot(),
      purpose: "Offline visualization and non-kinetic safety training",
      disclaimer: "This is not physical RP1 telemetry, validated controls, or a hardware safety stop."
    }, null, 2);
  }
}
