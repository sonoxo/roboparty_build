import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const modules = [...html.matchAll(/<script\s+type="module"\s*>([\s\S]*?)<\/script>/gi)];

// Free smoke tests using Node.js built-in modules. No npm install or AI credits.
test('standalone HTML entry point is present', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<meta\s+name="viewport"/i);
  assert.match(html, /<main\s+id="viewport"/i);
  assert.match(html, /<\/html>\s*$/i);
});

test('Three.js and OrbitControls use a pinned free CDN version', () => {
  assert.match(html, /"three":\s*"https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.170\.0\/build\/three\.module\.js"/);
  assert.match(html, /"three\/addons\/":\s*"https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.170\.0\/examples\/jsm\/"/);
  assert.match(html, /import\s+\{\s*OrbitControls\s*\}\s+from\s+'three\/addons\/controls\/OrbitControls\.js'/);
});

test('module JavaScript parses correctly', () => {
  assert.equal(modules.length, 1);
  const check = spawnSync(process.execPath, ['--check', '--input-type=module'], {
    input: modules[0][1], encoding: 'utf8', timeout: 10000,
  });
  assert.equal(check.status, 0, check.stderr || check.error?.message);
});

test('all three independent vehicle groups and essential meshes exist', () => {
  for (const key of ['tank', 'mech', 'ship']) {
    assert.match(html, new RegExp('const ' + key + ' = new THREE\\.Group\\(\\)'));
  }
  for (const part of [
    'main forward cannon', 'heavy continuous tread pod', 'rear engine block',
    'central armored body', 'upper articulated leg armor', 'knee pivot joint',
    'Top-mounted weapon and sensor pod', 'long angular armored fuselage',
    'side-mounted VTOL nacelle', 'VTOL fan rotor',
  ]) {
    assert.ok(html.includes(part), 'Missing vehicle component: ' + part);
  }
  assert.match(html, /new THREE\.BoxGeometry\(/);
  assert.match(html, /new THREE\.CylinderGeometry\(/);
  assert.match(html, /new THREE\.MeshStandardMaterial\(/);
});

test('interactive controls, animation and fallbacks are wired', () => {
  for (const id of ['home-button', 'rotate-button', 'wire-button', 'error']) {
    assert.ok(html.includes('id="' + id + '"'), 'Missing UI element: ' + id);
    assert.ok(html.includes("getElementById('" + id + "')"), 'Missing handler: ' + id);
  }
  for (const focus of ['tank', 'mech', 'ship']) {
    assert.ok(html.includes('data-focus="' + focus + '"'));
  }
  assert.match(html, /window\.addEventListener\('resize'/);
  assert.match(html, /requestAnimationFrame\(animate\)/);
  assert.match(html, /window\.__vehicleViewerReady\s*=\s*true/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /window\.addEventListener\('keydown'/);
});
