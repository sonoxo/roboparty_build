import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoboLabState, SCENARIOS } from './mission-core.mjs';

// Render-only Three.js visual front end. There is deliberately no ROS, CAN, WebSocket,
// serial, network telemetry, or motor-command transport in this application.
const state = new RoboLabState();
const $ = (id) => document.getElementById(id);
const view = $('viewport');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 800 ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('aria-label', '3D simulated humanoid; drag to orbit and pinch or scroll to zoom');
view.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#07151e');
scene.fog = new THREE.FogExp2('#07151e', 0.028);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.08, 160);
camera.position.set(10, 7.1, 12);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.3, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4;
controls.maxDistance = 35;
controls.maxPolarAngle = Math.PI * 0.48;
controls.update();

scene.add(new THREE.HemisphereLight('#abdaeb', '#172831', 2.1));
const key = new THREE.DirectionalLight('#e6f6ff', 3.0);
key.position.set(-8, 16, 11);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -22;
key.shadow.camera.right = 22;
key.shadow.camera.top = 22;
key.shadow.camera.bottom = -22;
key.shadow.bias = -0.0003;
scene.add(key);
const rim = new THREE.DirectionalLight('#52d8ed', 2.0);
rim.position.set(11, 9, -8);
scene.add(rim);

function material(color, metalness = .35, roughness = .54, emissive = null, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({
    color, metalness, roughness,
    emissive: emissive || '#000000', emissiveIntensity
  });
}
const paint = {
  white: material('#d5e3eb', .42, .32),
  pearl: material('#9cbac8', .43, .41),
  gray: material('#3e5968', .73, .33),
  dark: material('#12232d', .43, .52),
  joint: material('#172f3a', .83, .3),
  blue: material('#3d8db9', .51, .29),
  glass: material('#041820', .33, .15),
  eye: material('#97fff0', .2, .16, '#76fce4', 1.4),
  amber: material('#efb67d', .3, .41, '#bb7a3f', .4),
  floor: material('#0d2431', .16, .81),
  crate: material('#264452', .46, .64)
};
const meshes = [];
function addMesh(parent, geometry, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  meshes.push(mesh);
  return mesh;
}
function box(parent, w, h, d, mat, x = 0, y = 0, z = 0) {
  return addMesh(parent, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
}
function cylinder(parent, r, h, mat, x = 0, y = 0, z = 0) {
  return addMesh(parent, new THREE.CylinderGeometry(r, r, h, 16), mat, x, y, z);
}
function sphere(parent, r, mat, x = 0, y = 0, z = 0) {
  return addMesh(parent, new THREE.SphereGeometry(r, 16, 12), mat, x, y, z);
}

const floor = addMesh(scene, new THREE.PlaneGeometry(90, 90), paint.floor);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.035;
floor.castShadow = false;
const grid = new THREE.GridHelper(42, 42, '#245d70', '#143845');
grid.position.y = 0.005;
scene.add(grid);
for (const r of [3.2, 5.5, 8.0]) {
  const circle = new THREE.Mesh(
    new THREE.RingGeometry(r - .018, r + .018, 96),
    new THREE.MeshBasicMaterial({ color: '#296478', transparent: true, opacity: .38, side: THREE.DoubleSide })
  );
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = .009;
  scene.add(circle);
}

// Original visual block-out inspired by RP1's general humanoid form.
// This is NOT RoboParty's CAD, official URDF, calibrated linkage model, or a physics simulation.
const avatar = new THREE.Group();
scene.add(avatar);
const body = new THREE.Group();
avatar.add(body);
box(body, .6, .30, .34, paint.gray, 0, 1.71, 0);
const chest = box(body, .92, .95, .40, paint.white, 0, 2.25, .01);
chest.scale.set(.94, 1, 1);
box(body, .69, .14, .42, paint.pearl, 0, 1.85, 0);
box(body, .24, .15, .035, paint.blue, 0, 2.38, .235);
box(body, .58, .08, .05, paint.dark, 0, 2.0, .225);
box(body, .12, .22, .14, paint.gray, 0, 2.87, 0);
const head = new THREE.Group();
head.position.set(0, 2.92, .035);
body.add(head);
box(head, .54, .39, .40, paint.pearl);
box(head, .47, .30, .055, paint.glass, 0, .02, .211);
box(head, .055, .155, .019, paint.eye, -.115, .03, .247);
box(head, .055, .155, .019, paint.eye, .115, .03, .247);
box(head, .37, .035, .05, paint.blue, 0, .215, 0);

function arm(side) {
  const root = new THREE.Group();
  root.position.set(side * .59, 2.57, 0);
  body.add(root);
  sphere(root, .15, paint.joint, 0, 0, 0);
  box(root, .25, .53, .27, paint.white, 0, -.27, 0);
  box(root, .29, .11, .30, paint.blue, 0, -.08, 0);
  const elbow = new THREE.Group();
  elbow.position.y = -.56;
  root.add(elbow);
  sphere(elbow, .12, paint.joint);
  box(elbow, .24, .46, .22, paint.pearl, 0, -.22, 0);
  cylinder(elbow, .12, .11, paint.gray, 0, -.47, 0);
  box(elbow, .19, .19, .18, paint.dark, 0, -.56, .02);
  return { root, elbow };
}
function leg(side) {
  const hip = new THREE.Group();
  hip.position.set(side * .28, 1.63, 0);
  body.add(hip);
  sphere(hip, .18, paint.joint, 0, 0, 0);
  box(hip, .29, .67, .33, paint.white, 0, -.36, 0);
  box(hip, .33, .16, .36, paint.blue, 0, -.12, 0);
  const knee = new THREE.Group();
  knee.position.y = -.74;
  hip.add(knee);
  cylinder(knee, .16, .27, paint.gray);
  box(knee, .28, .62, .29, paint.pearl, 0, -.34, 0);
  box(knee, .31, .22, .31, paint.dark, 0, -.11, 0);
  const ankle = new THREE.Group();
  ankle.position.y = -.70;
  knee.add(ankle);
  sphere(ankle, .105, paint.joint);
  box(ankle, .29, .18, .49, paint.white, 0, -.055, .105);
  box(ankle, .30, .07, .52, paint.dark, 0, -.125, .105);
  return { hip, knee, ankle };
}
const leftArm = arm(-1);
const rightArm = arm(1);
const leftLeg = leg(-1);
const rightLeg = leg(1);
const underglow = new THREE.PointLight('#66caca', 1.2, 4, 2);
underglow.position.set(0, 1.2, 0);
avatar.add(underglow);

const missionLayer = new THREE.Group();
scene.add(missionLayer);
let markers = [];
const routeMat = new THREE.LineBasicMaterial({ color: '#5a9fb3', transparent: true, opacity: .65 });
function clearLayer() {
  missionLayer.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material && !Object.values(paint).includes(obj.material)) {
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
  });
  missionLayer.clear();
  markers = [];
}
function titleSprite(label) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 80);
  ctx.fillStyle = 'rgba(6,21,28,.88)';
  ctx.fillRect(8, 7, 496, 66);
  ctx.strokeStyle = '#6debd2';
  ctx.strokeRect(8, 7, 496, 66);
  ctx.fillStyle = '#d9fbf6';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(label.slice(0, 27), 25, 51);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(2.75, .43, 1);
  return sprite;
}
function buildMission() {
  clearLayer();
  const route = SCENARIOS[state.scenario].waypoints;
  const points = [new THREE.Vector3(0, .04, 0), ...route.map((p) => new THREE.Vector3(p.x, .04, p.z))];
  missionLayer.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), routeMat));
  route.forEach((p, i) => {
    const markerMaterial = new THREE.MeshBasicMaterial({ color: '#5fbbad', side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.32, .031, 8, 32), markerMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(p.x, .071, p.z);
    missionLayer.add(ring);
    const beamMat = new THREE.MeshBasicMaterial({ color: '#54c7c2', transparent: true, opacity: .31, depthWrite: false });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, 1.36, 8), beamMat);
    beam.position.set(p.x, .72, p.z);
    missionLayer.add(beam);
    const label = titleSprite((i + 1).toString().padStart(2, '0') + '  ' + p.label.toUpperCase());
    label.position.set(p.x, 1.62, p.z);
    missionLayer.add(label);
    markers.push(ring);
  });
  const spots = [
    [-6, -5, 1.5], [-5.3, 4.7, .85], [5.8, 4.8, 1.7], [6, -4.8, 1.1], [-.8, -6.6, 1.2]
  ];
  spots.forEach(([x, z, h], i) => {
    box(missionLayer, 1.8, h, 1.6, i % 2 ? paint.crate : paint.gray, x, h / 2, z);
    box(missionLayer, 1.5, .06, 1.3, paint.blue, x, h + .04, z);
  });
  $('scenario-info').textContent = SCENARIOS[state.scenario].description;
}
buildMission();

function animateAvatar(data) {
  const active = data.status === 'running';
  const phase = data.simSeconds * 4.6;
  const gait = active ? Math.sin(phase) : 0;
  const kneeFlexL = active ? Math.max(0, -gait) * .58 : 0;
  const kneeFlexR = active ? Math.max(0, gait) * .58 : 0;
  body.position.y = active ? Math.abs(Math.sin(phase)) * .035 : 0;
  body.rotation.z = active ? Math.sin(phase) * .022 : 0;
  leftLeg.hip.rotation.x = active ? gait * .34 : 0;
  rightLeg.hip.rotation.x = active ? -gait * .34 : 0;
  leftLeg.knee.rotation.x = kneeFlexL;
  rightLeg.knee.rotation.x = kneeFlexR;
  leftLeg.ankle.rotation.x = -kneeFlexL * .5;
  rightLeg.ankle.rotation.x = -kneeFlexR * .5;
  leftArm.root.rotation.set(-gait * .25, 0, -.09);
  rightArm.root.rotation.set(gait * .25, 0, .09);
  leftArm.elbow.rotation.x = -.10;
  rightArm.elbow.rotation.x = -.10;
  head.rotation.x = 0;
  head.rotation.y = active ? Math.sin(data.simSeconds * .8) * .07 : 0;
  if (!active && data.pose === 'wave') {
    rightArm.root.rotation.x = -1.3;
    rightArm.root.rotation.z = .1;
    rightArm.elbow.rotation.x = -1.15 + Math.sin(performance.now() * .006) * .23;
  } else if (!active && data.pose === 'inspect') {
    head.rotation.x = .3;
    leftArm.root.rotation.x = -.57;
    rightArm.root.rotation.x = -.57;
  } else if (!active && data.pose === 'reach') {
    rightArm.root.rotation.x = -1.25;
    rightArm.elbow.rotation.x = -.7;
  }
  avatar.position.set(data.position.x, 0, data.position.z);
  avatar.rotation.y = active ? Math.atan2(
    SCENARIOS[state.scenario].waypoints[data.stepIndex]?.x - data.position.x || 0,
    SCENARIOS[state.scenario].waypoints[data.stepIndex]?.z - data.position.z || 1
  ) : avatar.rotation.y;
  markers.forEach((ring, i) => {
    ring.material.color.set(i < data.stepIndex ? '#6be9a1' : i === data.stepIndex ? '#ffca8e' : '#4c9dac');
    ring.scale.setScalar(i === data.stepIndex && active ? 1 + Math.sin(data.simSeconds * 5) * .09 : 1);
  });
}
const timeLabel = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
let lastEventCount = -1;
function updateUi(data) {
  $('battery').textContent = data.batteryPercent.toFixed(1) + '%';
  $('clock').textContent = timeLabel(data.simSeconds);
  $('waypoint').textContent = data.stepIndex + ' / ' + data.totalSteps;
  $('position').textContent = data.position.x.toFixed(1) + ' / ' + data.position.z.toFixed(1) + ' m';
  $('status').textContent = data.status.toUpperCase();
  $('status').className = 'stat-pill' + (data.estopLatched ? ' stopped' : data.status === 'complete' ? ' done' : '');
  $('safety').textContent = data.estopLatched ? 'LATCHED / RESET' : 'READY / SIM';
  $('checkpoint').textContent = data.status === 'complete' ? 'MISSION COMPLETE' : data.estopLatched ? 'SIMULATION STOPPED' : data.nextCheckpoint;
  $('mission-caption').textContent = data.mission + ' · ' + (data.stepIndex + (data.status === 'complete' ? 0 : 1)) + ' / ' + data.totalSteps + ' checkpoints';
  $('progress-label').textContent = data.progressPercent + '%';
  $('progress').style.width = data.progressPercent + '%';
  $('progress-track').setAttribute('aria-valuenow', String(data.progressPercent));
  $('top-state').textContent = 'SIMULATION / ' + data.status.toUpperCase();
  $('start').disabled = data.estopLatched || data.status === 'running' || data.status === 'complete';
  $('pause').disabled = data.status !== 'running';
  $('step').disabled = data.estopLatched || data.status === 'running' || data.status === 'complete';
  $('pose').disabled = data.estopLatched || data.status === 'running';
  if (data.pose !== $('pose').value) $('pose').value = data.pose;
  if (data.events.length !== lastEventCount) {
    lastEventCount = data.events.length;
    const log = $('log');
    log.replaceChildren();
    data.events.slice(-7).reverse().forEach((ev) => {
      const line = document.createElement('div');
      line.className = 'logitem';
      const head = document.createElement('div');
      const code = document.createElement('b');
      code.textContent = ev.code + ' ';
      const time = document.createElement('small');
      time.textContent = 't+' + ev.t.toFixed(1) + 's';
      head.append(code, time);
      const message = document.createElement('div');
      message.textContent = ev.message;
      line.append(head, message);
      log.appendChild(line);
    });
  }
}
function renderFrame(time) {
  const seconds = lastFrame === null ? 0 : Math.min((time - lastFrame) / 1000, .25);
  lastFrame = time;
  const data = state.tick(seconds);
  animateAvatar(data);
  controls.update();
  renderer.render(scene, camera);
  if (time - lastUi >= 120) {
    updateUi(data);
    lastUi = time;
  }
  if (!window.__rp1LabReady) window.__rp1LabReady = true;
  requestAnimationFrame(renderFrame);
}
let lastFrame = null;
let lastUi = -1000;

$('scenario').addEventListener('change', (event) => {
  state.selectScenario(event.target.value);
  lastEventCount = -1;
  avatar.rotation.y = 0;
  buildMission();
  updateUi(state.snapshot());
});
$('start').addEventListener('click', () => { state.start(); updateUi(state.snapshot()); });
$('pause').addEventListener('click', () => { state.pause(); updateUi(state.snapshot()); });
$('step').addEventListener('click', () => { state.step(); updateUi(state.snapshot()); });
$('reset').addEventListener('click', () => {
  state.reset();
  $('speed').value = '1';
  $('speed-value').textContent = '1.0x';
  lastEventCount = -1;
  avatar.rotation.y = 0;
  updateUi(state.snapshot());
});
$('estop').addEventListener('click', () => { state.emergencyStop(); updateUi(state.snapshot()); });
$('pose').addEventListener('change', (event) => { state.setPose(event.target.value); updateUi(state.snapshot()); });
$('speed').addEventListener('input', (event) => {
  const newValue = state.setSpeed(event.target.value);
  $('speed-value').textContent = newValue.toFixed(2).replace(/0$/, '') + 'x';
  updateUi(state.snapshot());
});
let wireframe = false;
$('wireframe').addEventListener('click', () => {
  wireframe = !wireframe;
  Object.values(paint).forEach((m) => { m.wireframe = wireframe; });
  $('wireframe').setAttribute('aria-pressed', String(wireframe));
  $('wireframe').textContent = wireframe ? 'WIREFRAME ON' : 'WIREFRAME OFF';
});
$('export').addEventListener('click', () => {
  const blob = new Blob([state.exportTrace()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'xunia-rp1-simulation-trace.json';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
window.addEventListener('keydown', (event) => {
  if (event.target && /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
  if (event.code === 'Space') {
    event.preventDefault();
    if (state.status === 'running') state.pause();
    else state.start();
    updateUi(state.snapshot());
  }
  if (event.key === 'Escape') {
    state.emergencyStop();
    updateUi(state.snapshot());
  }
});
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 800 ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
});
updateUi(state.snapshot());
requestAnimationFrame(renderFrame);
