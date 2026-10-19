import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { RoboLabState, SCENARIOS, SIMULATION_ONLY } from '../mission-core.mjs';

test('three non-kinetic missions are defined', () => {
  assert.equal(Object.keys(SCENARIOS).length, 3);
  for (const route of Object.values(SCENARIOS)) {
    assert.equal(route.waypoints.length, 4);
    assert.ok(route.waypoints.every((p) => Number.isFinite(p.x) && Number.isFinite(p.z)));
  }
  assert.equal(SIMULATION_ONLY, true);
});
test('starts, advances deterministically, pauses, and completes', () => {
  const lab = new RoboLabState();
  assert.equal(lab.start(), true);
  for (let i = 0; i < 88; i++) lab.tick(.25);
  assert.equal(lab.snapshot().status, 'complete');
  assert.equal(lab.snapshot().progressPercent, 100);
  assert.equal(lab.snapshot().stepIndex, 4);
  assert.equal(lab.start(), false);
  assert.ok(lab.snapshot().events.some((ev) => ev.code === 'COMPLETE'));
});
test('pause and step are exclusive', () => {
  const lab = new RoboLabState();
  assert.equal(lab.step(), true);
  assert.equal(lab.snapshot().stepIndex, 1);
  lab.start();
  assert.equal(lab.step(), false);
  lab.pause();
  const first = lab.snapshot().simSeconds;
  lab.tick(.25);
  assert.equal(lab.snapshot().simSeconds, first);
  assert.equal(lab.step(), true);
});
test('simulation emergency-stop latches until reset', () => {
  const lab = new RoboLabState();
  lab.start();
  lab.tick(.25);
  lab.emergencyStop();
  assert.equal(lab.snapshot().estopLatched, true);
  assert.equal(lab.start(), false);
  assert.equal(lab.step(), false);
  assert.equal(lab.setPose('wave'), false);
  const point = lab.snapshot().position;
  lab.tick(.25);
  assert.deepEqual(lab.snapshot().position, point);
  lab.reset();
  assert.equal(lab.snapshot().estopLatched, false);
  assert.equal(lab.start(), true);
});
test('scenario switching and pose input are validated', () => {
  const lab = new RoboLabState();
  assert.throws(() => lab.selectScenario('unknown'), RangeError);
  lab.selectScenario('infrastructure');
  assert.equal(lab.snapshot().scenario, 'infrastructure');
  assert.equal(lab.setPose('reach'), true);
  assert.equal(lab.setPose('fire'), false);
  assert.equal(lab.snapshot().pose, 'reach');
  lab.start();
  assert.equal(lab.setPose('wave'), false);
});
test('sim clock bounded and speed clamped', () => {
  const lab = new RoboLabState();
  assert.equal(lab.setSpeed(100), 2);
  assert.equal(lab.setSpeed(-3), .5);
  lab.start();
  lab.tick(10000);
  assert.equal(lab.snapshot().simSeconds, .125);
});
test('provenance is synthetic and hardware interaction is disabled', () => {
  const lab = new RoboLabState();
  const trace = JSON.parse(lab.exportTrace());
  assert.equal(trace.provenance, 'synthetic-simulator');
  assert.equal(trace.hardwareConnected, false);
  assert.equal(trace.hardwareCommandSupported, false);
  assert.ok(trace.events.every((event) => event.source === 'synthetic-simulator'));
});
test('static browser UI declares pinned three.js, offline safety, controls', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf-8');
  const ui = readFileSync(new URL('../app.mjs', import.meta.url), 'utf-8');
  assert.match(html, /three@0\.170\.0/);
  for (const id of ['scenario','start','pause','step','reset','estop','pose','speed','export','wireframe']) {
    assert.match(html, new RegExp('id="' + id + '"'));
    assert.match(ui, new RegExp("\\$\\('" + id + "'\\)"));
  }
  assert.match(html, /NO ROBOT CONNECTED/);
  assert.doesNotMatch(ui, /new WebSocket|navigator\.serial|navigator\.usb/);
  const parsed = spawnSync(process.execPath, ['--check', '--input-type=module'], {
    input: ui, encoding: 'utf8', timeout: 10000
  });
  assert.equal(parsed.status, 0, parsed.stderr);
});
