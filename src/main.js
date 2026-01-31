import * as THREE from "three";
import { createScene } from "./scene-setup.js";

const TIMEZONES = [
  { value: "Asia/Ho_Chi_Minh", label: "Hanoi / Vietnam" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Tokyo", label: "Tokyo / Japan" },
  { value: "Asia/Shanghai", label: "Shanghai / China" },
  { value: "Australia/Sydney", label: "Sydney / Australia" },
  { value: "Europe/London", label: "London / UK" },
  { value: "Europe/Paris", label: "Paris / France" },
  { value: "America/New_York", label: "New York / USA" },
  { value: "America/Los_Angeles", label: "Los Angeles / USA" },
];

const DEFAULT_TZ = "Asia/Ho_Chi_Minh";

const container = document.getElementById("canvas-container");
const { scene, camera, updateShapeAnimation, cube1Params, cubesGroup } = createScene();
const clock = new THREE.Clock();

const ROTATION_SENSITIVITY = 0.002;
const KEY_ROTATION_SPEED = 1.2; // rad/s

container.addEventListener("wheel", (e) => {
  e.preventDefault();
  cubesGroup.rotation.x -= e.deltaY * ROTATION_SENSITIVITY;
}, { passive: false });

const keyStates = {};
const keysY = { a: 1, d: -1, ArrowLeft: 1, ArrowRight: -1 };
const keysX = { w: 1, s: -1, ArrowUp: 1, ArrowDown: -1 };

function onKeyDown(e) {
  if (keysY[e.code] !== undefined || keysX[e.code] !== undefined) {
    e.preventDefault();
    keyStates[e.code] = true;
  }
}
function onKeyUp(e) {
  if (keysY[e.code] !== undefined || keysX[e.code] !== undefined) {
    keyStates[e.code] = false;
  }
}
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);

let currentTimezone = DEFAULT_TZ;
const tzSelect = document.getElementById("tz-select");
const tzDateEl = document.getElementById("tz-date");
const tzTimeEl = document.getElementById("tz-time");

tzSelect.innerHTML = TIMEZONES.map(
  (tz) => `<option value="${tz.value}"${tz.value === DEFAULT_TZ ? " selected" : ""}>${tz.label}</option>`
).join("");
tzSelect.addEventListener("change", () => {
  currentTimezone = tzSelect.value;
});

function formatDateInZone(timezone) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    dateStyle: "long",
  }).format(new Date());
}

function formatTimeInZone(timezone) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Cấu hình camera theo tỷ lệ màn hình ngay từ đầu (tránh stretch khi width lớn)
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
onResize();

// Debug panel: điều chỉnh camera (x, y, z, góc nhìn) góc phải trên
const debugEl = document.getElementById("debug-camera");
debugEl.innerHTML = `
  <h3>Camera</h3>
  <div class="row"><label>X</label><input type="number" id="cam-x" step="0.5" /></div>
  <div class="row"><label>Y</label><input type="number" id="cam-y" step="0.5" /></div>
  <div class="row"><label>Z</label><input type="number" id="cam-z" step="0.5" /></div>
  <div class="row"><label>FOV</label><input type="number" id="cam-fov" min="1" max="120" step="1" /></div>
`;

const inputX = document.getElementById("cam-x");
const inputY = document.getElementById("cam-y");
const inputZ = document.getElementById("cam-z");
const inputFov = document.getElementById("cam-fov");

function updateDebugInputs() {
  inputX.value = camera.position.x;
  inputY.value = camera.position.y;
  inputZ.value = camera.position.z;
  inputFov.value = camera.fov;
}
updateDebugInputs();

function onCameraInput() {
  const x = parseFloat(inputX.value);
  const y = parseFloat(inputY.value);
  const z = parseFloat(inputZ.value);
  const fov = parseFloat(inputFov.value);
  if (!Number.isNaN(x)) camera.position.x = x;
  if (!Number.isNaN(y)) camera.position.y = y;
  if (!Number.isNaN(z)) camera.position.z = z;
  if (!Number.isNaN(fov) && fov >= 1 && fov <= 120) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  camera.lookAt(0, 0, 0);
}

inputX.addEventListener("input", onCameraInput);
inputY.addEventListener("input", onCameraInput);
inputZ.addEventListener("input", onCameraInput);
inputFov.addEventListener("input", onCameraInput);

// Debug panel: cube 1 (Y, scale, màu base, độ sáng) góc trái trên
const debugCube1El = document.getElementById("debug-cube1");
debugCube1El.innerHTML = `
  <h3>Cube 1</h3>
  <div class="row"><label>Y</label><input type="number" id="cube1-y" step="0.01" /></div>
  <div class="row"><label>Scale</label><input type="number" id="cube1-scale" step="0.01" /></div>
  <div class="row"><label>Màu</label><input type="color" id="cube1-color" /></div>
  <div class="row"><label>Sáng</label><input type="number" id="cube1-brightness" step="0.1" min="0" /></div>
`;
const inputCube1Y = document.getElementById("cube1-y");
const inputCube1Scale = document.getElementById("cube1-scale");
const inputCube1Color = document.getElementById("cube1-color");
const inputCube1Brightness = document.getElementById("cube1-brightness");
inputCube1Y.value = cube1Params.peakY;
inputCube1Scale.value = cube1Params.peakScale;
inputCube1Color.value = "#" + cube1Params.color.toString(16).padStart(6, "0");
inputCube1Brightness.value = cube1Params.brightness;
inputCube1Y.addEventListener("input", () => {
  const v = parseFloat(inputCube1Y.value);
  if (!Number.isNaN(v)) cube1Params.peakY = v;
});
inputCube1Scale.addEventListener("input", () => {
  const v = parseFloat(inputCube1Scale.value);
  if (!Number.isNaN(v)) cube1Params.peakScale = v;
});
inputCube1Color.addEventListener("input", () => {
  cube1Params.color = parseInt(inputCube1Color.value.slice(1), 16);
});
inputCube1Brightness.addEventListener("input", () => {
  const v = parseFloat(inputCube1Brightness.value);
  if (!Number.isNaN(v) && v >= 0) cube1Params.brightness = v;
});

window.addEventListener("resize", onResize);

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  for (const code of Object.keys(keysY)) {
    if (keyStates[code]) cubesGroup.rotation.y += keysY[code] * KEY_ROTATION_SPEED * delta;
  }
  for (const code of Object.keys(keysX)) {
    if (keyStates[code]) cubesGroup.rotation.x += keysX[code] * KEY_ROTATION_SPEED * delta;
  }
  updateShapeAnimation(clock.getElapsedTime(), currentTimezone);
  tzDateEl.textContent = formatDateInZone(currentTimezone);
  tzTimeEl.textContent = formatTimeInZone(currentTimezone);
  renderer.render(scene, camera);
}

animate();
