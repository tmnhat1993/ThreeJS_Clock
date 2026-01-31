import * as THREE from "three";
import { getTimeGrid, GRID_SIZE_X, GRID_SIZE_Z } from "./shape-data.js";

const RISE_DURATION = 0.5;
const FALL_DURATION = 0.5;
const RISE_STAGGER = 0.05;
const FALL_STAGGER = 0.05;
const PEAK_Y = 0;
const PEAK_SCALE = 1.56;

const FALL_TOTAL = (GRID_SIZE_X - 1) * FALL_STAGGER + FALL_DURATION;
const RISE_TOTAL = (GRID_SIZE_X - 1) * RISE_STAGGER + RISE_DURATION;
const TRANSITION_DURATION = FALL_TOTAL + RISE_TOTAL;

function easeOutQuad(x) {
  return 1 - (1 - x) * (1 - x);
}

/**
 * Scene: đồng hồ điện tử 17×7 (HH:MM). Nâng lên giữ màu đỏ cam sáng.
 * @returns {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera, updateShapeAnimation: (time: number, timezone?: string) => void, cube1Params: { peakY: number, peakScale: number, color: number, brightness: number } }}
 */
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x5a8cc4); // blue pastel hơi vibrant

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.6);
  directionalLight.position.set(0, 10, 0);
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.78);
  scene.add(ambientLight);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0.32, 2.25, 1.2);
  camera.lookAt(0, 0, 0);

  const cube1Params = { peakY: PEAK_Y, peakScale: PEAK_SCALE, color: 0xe9d826, brightness: 1.5 };

  const sizeX = GRID_SIZE_X;
  const sizeZ = GRID_SIZE_Z;
  const cubeSize = 0.5 / 8;
  const spacing = cubeSize * 2 * 1.15 * 2 * 0.75 * 0.77; // gần 30% rồi giãn thêm 10%
  const halfX = (sizeX - 1) / 2;
  const halfZ = (sizeZ - 1) / 2;

  const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  const dimColor = new THREE.Color(0x606060);
  const riseColor = new THREE.Color(0xff6600); // cập nhật từ cube1Params.color mỗi frame
  const materialDim = new THREE.MeshStandardMaterial({
    color: dimColor.clone(),
    metalness: 0.9,
    roughness: 0.25,
  });
  const materialTransitionTemplate = new THREE.MeshStandardMaterial({
    color: dimColor.clone(),
    metalness: 0.9,
    roughness: 0.2,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0,
  });

  let lastDisplayedMinute = -1;
  let lastTimezone = "Asia/Ho_Chi_Minh";
  let cycleStartTime = 0;
  let currentTimeGrid = getTimeGrid(0, 0);
  let previousTimeGrid = currentTimeGrid.map((row) => [...row]);
  const waveSpheres = [];
  const cubesGroup = new THREE.Group();

  for (let ix = 0; ix < sizeX; ix++) {
    for (let iz = 0; iz < sizeZ; iz++) {
      const sphere = new THREE.Mesh(geometry, materialDim);
      sphere.position.set((ix - halfX) * spacing, 0, (iz - halfZ) * spacing);
      sphere.userData = { ix, iz };
      cubesGroup.add(sphere);
      waveSpheres.push(sphere);
    }
  }
  scene.add(cubesGroup);

  function getHourMinuteInZone(timezone) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === "hour").value, 10);
    const minute = parseInt(parts.find((p) => p.type === "minute").value, 10);
    return { hour, minute };
  }

  function updateShapeAnimation(time, timezone = "Asia/Ho_Chi_Minh") {
    const { hour, minute } = getHourMinuteInZone(timezone);
    const timezoneChanged = timezone !== lastTimezone;
    if (timezoneChanged || minute !== lastDisplayedMinute) {
      if (timezoneChanged) lastTimezone = timezone;
      const isFirstDisplay = lastDisplayedMinute === -1 && !timezoneChanged;
      if (!isFirstDisplay) {
        previousTimeGrid = currentTimeGrid.map((row) => [...row]);
      }
      currentTimeGrid = getTimeGrid(hour, minute);
      lastDisplayedMinute = minute;
      cycleStartTime = isFirstDisplay ? time - TRANSITION_DURATION - 0.1 : time;
    }
    const localT = time - cycleStartTime;

    const isHold = localT >= TRANSITION_DURATION;
    const isFall = localT < FALL_TOTAL;
    const isRise = !isHold && !isFall;
    const grid = isFall ? previousTimeGrid : currentTimeGrid;

    waveSpheres.forEach((sphere) => {
      const { ix, iz } = sphere.userData;
      const value = grid[iz][ix];
      if (value === 0) {
        sphere.position.y = 0;
        sphere.scale.setScalar(1);
        sphere.material = materialDim;
        return;
      }
      let progress = 0;
      if (isHold) {
        progress = 1;
      } else if (isFall) {
        const fallStart = ix * FALL_STAGGER;
        const fallEnd = fallStart + FALL_DURATION;
        if (localT < fallStart) progress = 1;
        else if (localT >= fallEnd) progress = 0;
        else progress = easeOutQuad(1 - (localT - fallStart) / FALL_DURATION);
      } else {
        const riseStart = FALL_TOTAL + ix * RISE_STAGGER;
        const riseEnd = riseStart + RISE_DURATION;
        if (localT < riseStart) progress = 0;
        else if (localT >= riseEnd) progress = 1;
        else progress = easeOutQuad((localT - riseStart) / RISE_DURATION);
      }
      sphere.position.y = cube1Params.peakY * progress;
      sphere.scale.setScalar(1 + (cube1Params.peakScale - 1) * progress);
      if (!sphere.userData.transitionMaterial) {
        sphere.userData.transitionMaterial = materialTransitionTemplate.clone();
      }
      riseColor.setHex(cube1Params.color);
      const mat = sphere.userData.transitionMaterial;
      mat.color.lerpColors(dimColor, riseColor, progress);
      mat.metalness = 0.9 + (0.85 - 0.9) * progress;
      mat.roughness = 0.25 + (0.06 - 0.25) * progress; // roughness thấp → mặt hướng sáng bóng, specular mạnh
      mat.emissive.copy(riseColor);
      mat.emissiveIntensity = progress * 0.53 * cube1Params.brightness;
      sphere.material = mat;
    });
  }

  return { scene, camera, updateShapeAnimation, cube1Params, cubesGroup };
}
