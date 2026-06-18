import './style.css';
import * as THREE from 'three';

// ─── Scene ────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 16, 40);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 100);
camera.position.set(-2, 1.7, 2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ─── Canvas textures ──────────────────────────────────────────────────────────
function canvasTex(draw, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const floorTex = canvasTex((ctx, s) => {
  const n = 6, sw = s / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#c4894a' : '#b87f40';
    ctx.fillRect(0, i * sw, s, sw);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, i * sw + 1, s - 2, sw - 2);
    for (let j = 0; j < 3; j++) {
      ctx.strokeStyle = 'rgba(60,20,0,0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const y = i * sw + Math.random() * sw;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(s * 0.3, y + 3, s * 0.7, y - 3, s, y);
      ctx.stroke();
    }
  }
});
floorTex.repeat.set(5, 5);

const wallTex = canvasTex((ctx, s) => {
  ctx.fillStyle = '#ece7dc';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 900; i++) {
    const v = 145 + Math.floor(Math.random() * 35);
    ctx.fillStyle = `rgba(${v},${v - 10},${v - 20},0.04)`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 4, 4);
  }
});
wallTex.repeat.set(2, 1);

function tilePattern(ctx, s, fill, line) {
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = line;
  ctx.lineWidth = 4;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(i * s / 4, 0); ctx.lineTo(i * s / 4, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * s / 4); ctx.lineTo(s, i * s / 4); ctx.stroke();
  }
}

const tileTex = canvasTex((ctx, s) => tilePattern(ctx, s, '#dbd5cd', '#bfb9b1'));
tileTex.repeat.set(2, 4);    // 1.25×1.25 m tiles for 2.5×5 kitchen

const tileBanoTex = canvasTex((ctx, s) => tilePattern(ctx, s, '#e8e4de', '#d0ccc4'));
tileBanoTex.repeat.set(4, 2.4); // ≈1.25 m tiles for 5×3 back rooms

// ─── Materials ────────────────────────────────────────────────────────────────
const M = {
  wall:    new THREE.MeshLambertMaterial({ map: wallTex }),
  floor:   new THREE.MeshLambertMaterial({ map: floorTex }),
  tile:    new THREE.MeshLambertMaterial({ map: tileTex }),
  tileBano: new THREE.MeshLambertMaterial({ map: tileBanoTex }),
  ceil:    new THREE.MeshLambertMaterial({ color: 0xf9f9f7 }),
  wood:    new THREE.MeshLambertMaterial({ color: 0xa07840 }),
  dkwood:  new THREE.MeshLambertMaterial({ color: 0x5c3d1e }),
  sofa:    new THREE.MeshLambertMaterial({ color: 0x6b7280 }),
  cushion: new THREE.MeshLambertMaterial({ color: 0x9ca3af }),
  glass:   new THREE.MeshLambertMaterial({ color: 0x88ccee, transparent: true, opacity: 0.35 }),
  wframe:  new THREE.MeshLambertMaterial({ color: 0xddd8cc }),
  tv:      new THREE.MeshBasicMaterial({ color: 0x060606 }),
  white:   new THREE.MeshLambertMaterial({ color: 0xffffff }),
  steel:   new THREE.MeshLambertMaterial({ color: 0xbcbcbc }),
  bed:     new THREE.MeshLambertMaterial({ color: 0x7c5c3a }),
  sheet:   new THREE.MeshLambertMaterial({ color: 0xe8e0d4 }),
  pillow:  new THREE.MeshLambertMaterial({ color: 0xf2eae0 }),
  green:   new THREE.MeshLambertMaterial({ color: 0x3a7030 }),
  terra:   new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
  blue:    new THREE.MeshLambertMaterial({ color: 0x4a6fa5 }),
  skyblue: new THREE.MeshLambertMaterial({ color: 0x89b4e0 }),
  brown:   new THREE.MeshLambertMaterial({ color: 0x8b6040 }),
  sand:    new THREE.MeshLambertMaterial({ color: 0xd4a87a }),
  rug:     new THREE.MeshLambertMaterial({ color: 0x7a6050 }),
  bedrug:  new THREE.MeshLambertMaterial({ color: 0x8a7060 }),
  blanket: new THREE.MeshLambertMaterial({ color: 0xd0c0a8 }),
  drk:     new THREE.MeshLambertMaterial({ color: 0x333333 }),
};

// ─── Lighting ─────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xfff8f0, 0.55));

const sun = new THREE.DirectionalLight(0xfff0e0, 0.7);
sun.position.set(4, 10, 4);
sun.castShadow = false; // interior — techo bloquea el sol
scene.add(sun);

function ceilingLight(x, z, color = 0xfff4e0, intensity = 1.0, dist = 8) {
  const light = new THREE.PointLight(color, intensity, dist);
  light.position.set(x, 2.8, z);
  light.castShadow = true;
  light.shadow.mapSize.width  = 512;
  light.shadow.mapSize.height = 512;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far  = dist;
  light.shadow.bias = -0.002;
  scene.add(light);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffcc })
  );
  bulb.position.copy(light.position);
  scene.add(bulb);

  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.03, 16),
    M.white
  );
  ring.position.set(x, 2.99, z);
  scene.add(ring);
}

ceilingLight(-1.0,  2.5);                       // sala
ceilingLight( 3.7,  2.5, 0xfff8f0, 0.8, 5);    // cocina
ceilingLight( 0.75, -1.5, 0xfff4e0, 0.7, 5);   // pasillo
ceilingLight(-2.5,  -5.5);                      // recámara 1
ceilingLight( 2.5,  -5.5);                      // recámara 2

// ─── Scene helpers ────────────────────────────────────────────────────────────
const colliders = []; // AABB list for XZ collision

function addMesh(w, h, d, x, y, z, mat, shadow = true, collidable = false) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  scene.add(m);
  if (collidable) {
    colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
  }
  return m;
}

function addWall(w, h, d, x, y, z) {
  return addMesh(w, h, d, x, y, z, M.wall, true, true);
}

// ─── Apartment structure ──────────────────────────────────────────────────────
// Layout (x[-5,5], z[-8,5]):
//   Sala/Comedor  : x[-5, 2.5], z[0, 5]
//   Cocina        : x[2.5, 5],  z[0, 5]
//   Baño          : x[-5, -1],  z[-3, 0]  ← desde pasillo
//   Pasillo       : x[-1, 2.5], z[-3, 0]
//   C. de lavado  : x[2.5, 5],  z[-3, 0]  ← desde cocina
//   Recámara 1    : x[-5, 0],   z[-8, -3]
//   Recámara 2    : x[0, 5],    z[-8, -3]

const H = 3;   // wall height
const Y = H / 2;

// Floors
const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 13), M.floor);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.set(0, 0, -1.5);
floorMesh.receiveShadow = true;
scene.add(floorMesh);

const kitchenFloor = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 5), M.tile);
kitchenFloor.rotation.x = -Math.PI / 2;
kitchenFloor.position.set(3.75, 0.005, 2.5);
kitchenFloor.receiveShadow = true;
scene.add(kitchenFloor);

// Baño floor (x[-5,-2], z[-3,0])
const banoFloor = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3), M.tileBano);
banoFloor.rotation.x = -Math.PI / 2;
banoFloor.position.set(-3.5, 0.005, -1.5);
banoFloor.receiveShadow = true;
scene.add(banoFloor);

// Cuarto de lavado floor (x[2.5,5], z[-3,0])
const lavadoFloor = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3), M.tileBano);
lavadoFloor.rotation.x = -Math.PI / 2;
lavadoFloor.position.set(3.75, 0.005, -1.5);
lavadoFloor.receiveShadow = true;
scene.add(lavadoFloor);

// Ceiling (full apartment)
const ceilMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 13), M.ceil);
ceilMesh.rotation.x = Math.PI / 2;
ceilMesh.position.set(0, H, -1.5);
scene.add(ceilMesh);

// Exterior walls (sides extended to z=-8 to cover back section)
addWall(5.6, H, 0.2, -2.3, Y,  5);   // front left  (x=-5.1 → x=0.5)
addMesh(1.5, 0.5, 0.2, 1.25, H-0.25, 5, M.wall, true, false); // lintel entrada
addWall(3.1, H, 0.2,  3.55, Y,  5);  // front right (x=2.0  → x=5.1)
addWall(0.2,  H, 13.2, -5, Y, -1.5); // left  (z: -8.1 → 5.1)
addWall(0.2,  H, 13.2,  5, Y, -1.5); // right (z: -8.1 → 5.1)
addWall(10.2, H, 0.2,  0, Y, -8);    // back exterior (new)

// z=0: sala/cocina ↔ service — pasillo gap x=-1.5→1, lavado gap x=3→4.5
addWall(3.5, H, 0.2, -3.25, Y, 0);                                // x=-5 → x=-1.5 (frente del baño)
addMesh(2.5, 0.5, 0.2, -0.25, H-0.25, 0, M.wall, true, false);  // lintel pasillo
addWall(2.0, H, 0.2,  2.0,  Y, 0);                              // x=1  → x=3
addMesh(1.5, 0.5, 0.2,  3.75, H-0.25, 0, M.wall, true, false); // lintel lavado
addWall(0.5, H, 0.2,  4.75, Y, 0);                              // x=4.5 → x=5

// x=2.5: sala/pasillo ↔ cocina/lavado — kitchen door gap z=2.5→3.75
addWall(0.2, H, 1.75, 2.5, Y,  0.875);                              // z=0   → z=1.75
addWall(0.2, H, 1.5,  2.5, Y,  4.25);                               // z=3.5  → z=5
addMesh(0.2, 0.5, 1.75, 2.5, H-0.25, 2.625, M.wall, true, false);  // lintel
addWall(0.2, H, 1.0, 2.5, Y, -2.5);                                 // z=-3   → z=-2.0
addMesh(0.2, 0.5, 1.0, 2.5, H-0.25, -1.5, M.wall, true, false);   // lintel entrada lavado
addWall(0.2, H, 1.0, 2.5, Y, -0.5);                                 // z=-1.0 → z=0
// Marco de puerta
addMesh(0.08, H, 0.08, 2.5, Y, -2.0, M.dkwood, false, false);     // jamba izq
addMesh(0.08, H, 0.08, 2.5, Y, -1.0, M.dkwood, false, false);     // jamba der
addMesh(0.08, 0.08, 1.0, 2.5, H-0.04, -1.5, M.dkwood, false, false); // cabezal

// x=-2: baño ↔ pasillo — door gap z=-1.5→-0.5
addWall(0.2, H, 1.5,  -2.0, Y, -2.25);                                // z=-3   → z=-1.5
addMesh(0.2, 0.5, 1.0, -2.0, H-0.25, -1.0,  M.wall, true, false);   // lintel
addWall(0.2, H, 0.5,  -2.0, Y, -0.25);                                // z=-0.5 → z=0

// z=-3: service ↔ recámaras — rec1 gap x=-1.5→-0.25, rec2 gap x=0.25→1.5 (simétricas)
addWall(3.5, H, 0.2, -3.25, Y, -3);                                  // x=-5 → x=-1.5 (pared sólida: baño)
addMesh(1.25, 0.5, 0.2, -0.875, H-0.25, -3, M.wall, true, false);  // lintel rec1
addWall(0.5, H, 0.2,  0, Y, -3);                                     // poste central x=-0.25→0.25 (centrado con divisor)
addMesh(1.25, 0.5, 0.2,  0.875, H-0.25, -3, M.wall, true, false);  // lintel rec2
addWall(3.5, H, 0.2,  3.25, Y, -3);                                  // x=1.5 → x=5

// x=0: Recámara 1 ↔ Recámara 2 (z[-8,-3])
addWall(0.2, H, 5.0, 0, Y, -5.5);

// ─── Windows ──────────────────────────────────────────────────────────────────
// Windows in walls oriented along X (front/back): winZ(x, z, innerSign)
function winZ(x, z, sign) {
  addMesh(1.4,  1.5, 0.1,  x, 1.75, z,              M.wframe, false, false); // frame
  addMesh(1.2,  1.3, 0.05, x, 1.75, z + sign * 0.03, M.glass,  false, false); // pane
  addMesh(1.6,  0.07, 0.2, x, 1.0,  z + sign * 0.1,  M.wframe, false, false); // sill
  // Cross dividers
  addMesh(1.18, 0.04, 0.04, x, 1.75, z + sign * 0.03, M.wframe, false, false);
  addMesh(0.04, 1.28, 0.04, x, 1.75, z + sign * 0.03, M.wframe, false, false);
}

// Windows in walls oriented along Z (side walls): winX(x, z, innerSign)
function winX(x, z, sign) {
  addMesh(0.1,  1.5, 1.4,  x,              1.75, z, M.wframe, false, false);
  addMesh(0.05, 1.3, 1.2,  x + sign * 0.03, 1.75, z, M.glass,  false, false);
  addMesh(0.2,  0.07, 1.6, x + sign * 0.1,  1.0,  z, M.wframe, false, false);
  addMesh(0.04, 0.04, 1.18, x + sign * 0.03, 1.75, z, M.wframe, false, false);
  addMesh(0.04, 1.28, 0.04, x + sign * 0.03, 1.75, z, M.wframe, false, false);
}

// Interior (protrude inward)
winZ(-1.5,  4.92, -1); // sala: front wall
winX(-4.92,  2.5,  1); // sala: left wall
winZ( 3.75, 4.92, -1); // cocina: front wall (x center of kitchen 2.5→5)
// baño: ventanas altas pequeñas (ver baño section)
winX( 4.92, -1.5, -1); // lavado: right wall
winX(-4.92, -5.5,  1); // recámara 1: left wall
winX( 4.92, -5.5, -1); // recámara 2: right wall

// Exterior (same positions, opposite sign → protrude outward)
winZ(-1.5,  5.08,  1); // sala: front wall
winX(-5.08,  2.5, -1); // sala: left wall
winZ( 3.75, 5.08,  1); // cocina: front wall
// baño: ventanas altas pequeñas (ver baño section)
winX( 5.08, -1.5,  1); // lavado: right wall
winX(-5.08, -5.5, -1); // recámara 1: left wall
winX( 5.08, -5.5,  1); // recámara 2: right wall

// ─── Door frames ──────────────────────────────────────────────────────────────
// Entrada dpto (z=5, x=0.5→2.0, center x=1.25)
addMesh(0.08, H, 0.08, 0.46, Y, 5, M.dkwood, false, false);
addMesh(0.08, H, 0.08, 2.04, Y, 5, M.dkwood, false, false);
addMesh(1.66, 0.08, 0.08, 1.25, H-0.04, 5, M.dkwood, false, false);

// Pasillo (z=0, x=-1.5→1, center x=-0.25)
addMesh(0.08, H, 0.08, -1.54, Y, 0, M.dkwood, false, false);
addMesh(0.08, H, 0.08,  1.04, Y, 0, M.dkwood, false, false);
addMesh(2.66, 0.08, 0.08, -0.25, H-0.04, 0, M.dkwood, false, false);


// Lavado (z=0, x=3→4.5, center x=3.75)
addMesh(0.08, H, 0.08,  2.96, Y, 0, M.dkwood, false, false);
addMesh(0.08, H, 0.08,  4.54, Y, 0, M.dkwood, false, false);
addMesh(1.66, 0.08, 0.08, 3.75, H-0.04, 0, M.dkwood, false, false);

// Baño (x=-2, z=-1.5→-0.5, center z=-1.0)
addMesh(0.08, H, 0.08, -2.0, Y, -1.54, M.dkwood, false, false);
addMesh(0.08, H, 0.08, -2.0, Y, -0.46, M.dkwood, false, false);
addMesh(0.08, 0.08, 1.08, -2.0, H-0.04, -1.0,  M.dkwood, false, false);

// Recámara 1 (z=-3, x=-1.5→-0.25, center x=-0.875)
addMesh(0.08, H, 0.08, -1.54, Y, -3, M.dkwood, false, false);
addMesh(0.08, H, 0.08, -0.21, Y, -3, M.dkwood, false, false);
addMesh(1.41, 0.08, 0.08, -0.875, H-0.04, -3, M.dkwood, false, false);

// Recámara 2 (z=-3, x=0.25→1.5, center x=0.875)
addMesh(0.08, H, 0.08,  0.21, Y, -3, M.dkwood, false, false);
addMesh(0.08, H, 0.08,  1.54, Y, -3, M.dkwood, false, false);
addMesh(1.41, 0.08, 0.08, 0.875, H-0.04, -3, M.dkwood, false, false);

// ─── Living room ──────────────────────────────────────────────────────────────
// Sofa: back against front wall (z≈5), seat faces TV at z≈0.75
const SX = -2.8; // desplazado a la izquierda para dejar libre el hueco de puerta (x=-1.5 a 1)
addMesh(2.4,  0.45, 0.9,  SX,       0.225, 4.05, M.sofa,    true, false); // seat base
addMesh(2.4,  0.65, 0.2,  SX,       0.70,  4.55, M.sofa,    true, false); // back rest (against wall)
addMesh(0.2,  0.55, 0.9,  SX - 1.1, 0.275, 4.05, M.sofa,   true, false); // left arm
addMesh(0.2,  0.55, 0.9,  SX + 1.1, 0.275, 4.05, M.sofa,   true, false); // right arm
addMesh(0.7,  0.18, 0.75, SX - 0.7, 0.56,  3.95, M.cushion, false, false); // cushions face TV
addMesh(0.7,  0.18, 0.75, SX,       0.56,  3.95, M.cushion, false, false);
addMesh(0.7,  0.18, 0.75, SX + 0.7, 0.56,  3.95, M.cushion, false, false);
colliders.push({ minX: SX - 1.2, maxX: SX + 1.2, minZ: 3.58, maxZ: 4.68 });

// Coffee table
addMesh(1.1,  0.05, 0.65, SX, 0.4, 3.1, M.wood, true, true);  // top
addMesh(0.06, 0.4,  0.06, SX - 0.47, 0.2, 3.1 - 0.27, M.dkwood, false, false); // leg FL
addMesh(0.06, 0.4,  0.06, SX + 0.47, 0.2, 3.1 - 0.27, M.dkwood, false, false); // leg FR
addMesh(0.06, 0.4,  0.06, SX - 0.47, 0.2, 3.1 + 0.27, M.dkwood, false, false); // leg BL
addMesh(0.06, 0.4,  0.06, SX + 0.47, 0.2, 3.1 + 0.27, M.dkwood, false, false); // leg BR
colliders.push({ minX: SX - 0.55, maxX: SX + 0.55, minZ: 2.78, maxZ: 3.43 });

// Living room rug under sofa+table
const lrRug = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.2), M.rug);
lrRug.rotation.x = -Math.PI / 2;
lrRug.position.set(SX, 0.003, 3.5);
lrRug.receiveShadow = true;
scene.add(lrRug);

// ─── Comedor ──────────────────────────────────────────────────────────────────
// Dining area in the right portion of the sala (near kitchen, x≈0.8, z≈2.7)
const TX = 0.8, TZ = 2.7;

// Table
addMesh(1.45, 0.07, 0.92, TX, 0.77, TZ, M.wood, true, true); // top
addMesh(0.07, 0.73, 0.07, TX-0.62, 0.365, TZ-0.39, M.dkwood, false, false);
addMesh(0.07, 0.73, 0.07, TX+0.62, 0.365, TZ-0.39, M.dkwood, false, false);
addMesh(0.07, 0.73, 0.07, TX-0.62, 0.365, TZ+0.39, M.dkwood, false, false);
addMesh(0.07, 0.73, 0.07, TX+0.62, 0.365, TZ+0.39, M.dkwood, false, false);
colliders.push({ minX: TX-0.73, maxX: TX+0.73, minZ: TZ-0.46, maxZ: TZ+0.46 });

// 4 chairs: north, south, west, east
function diningChair(cx, cz, bOffZ, bOffX) {
  addMesh(0.44, 0.05, 0.44, cx, 0.48, cz, M.wood, true, false);
  const bw = bOffX !== 0 ? 0.05 : 0.44;
  const bd = bOffX !== 0 ? 0.44 : 0.05;
  addMesh(bw, 0.44, bd, cx + bOffX, 0.72, cz + bOffZ, M.wood, true, false);
  const lx = 0.18, lz = 0.18;
  [[cx-lx,cz-lz],[cx+lx,cz-lz],[cx-lx,cz+lz],[cx+lx,cz+lz]].forEach(([x,z]) =>
    addMesh(0.05, 0.48, 0.05, x, 0.24, z, M.dkwood, false, false));
}
diningChair(TX,       TZ-0.72, -0.22,  0);
diningChair(TX,       TZ+0.72,  0.22,  0);
diningChair(TX-0.95,  TZ,       0,    -0.22);
diningChair(TX+0.95,  TZ,       0,     0.22);

// Rug + pendant lamp
const comedorRug = new THREE.Mesh(
  new THREE.PlaneGeometry(2.7, 2.1),
  new THREE.MeshLambertMaterial({ color: 0x6a5a4a })
);
comedorRug.rotation.x = -Math.PI / 2;
comedorRug.position.set(TX, 0.002, TZ);
comedorRug.receiveShadow = true;
scene.add(comedorRug);

// Ventilador de techo con farol sobre el comedor
addMesh(0.04, 0.30, 0.04, TX, 2.85, TZ, M.steel, false, false); // varilla (down rod)

const fanMotor = new THREE.Mesh(
  new THREE.CylinderGeometry(0.20, 0.20, 0.16, 16),
  M.steel
);
fanMotor.position.set(TX, 2.62, TZ);
fanMotor.castShadow = true;
scene.add(fanMotor);

// 4 aspas de madera
const bladeMat = new THREE.MeshLambertMaterial({ color: 0xa07840 });
for (let i = 0; i < 4; i++) {
  const angle = (i / 4) * Math.PI * 2;
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.018, 0.13), bladeMat);
  blade.position.set(TX + Math.cos(angle) * 0.33, 2.595, TZ + Math.sin(angle) * 0.33);
  blade.rotation.y = angle;
  blade.castShadow = true;
  blade.receiveShadow = true;
  scene.add(blade);
}

// Canopy inferior (eje de aspas)
const fanCanopy = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12), M.steel);
fanCanopy.position.set(TX, 2.515, TZ);
scene.add(fanCanopy);

// Farol — cuenco de vidrio esmerilado
const fanBowl = new THREE.Mesh(
  new THREE.CylinderGeometry(0.17, 0.11, 0.15, 16),
  new THREE.MeshLambertMaterial({ color: 0xfff8ee, transparent: true, opacity: 0.82 })
);
fanBowl.position.set(TX, 2.41, TZ);
fanBowl.castShadow = true;
scene.add(fanBowl);

const comedorLight = new THREE.PointLight(0xfff4cc, 1.0, 5.5);
comedorLight.position.set(TX, 2.36, TZ);
comedorLight.castShadow = true;
comedorLight.shadow.mapSize.width  = 512;
comedorLight.shadow.mapSize.height = 512;
comedorLight.shadow.camera.near = 0.1;
comedorLight.shadow.camera.far  = 5.5;
comedorLight.shadow.bias = -0.002;
scene.add(comedorLight);

// ─── TV stand ─────────────────────────────────────────────────────────────────
// TV stand — espalda pegada a la pared (cara interior z=0.1)
addMesh(1.7,  0.5,  0.45, SX, 0.25, 0.325, M.dkwood, true, true); // cabinet
addMesh(0.06, 0.45, 0.04, SX - 0.75, 0.25, 0.54, M.dkwood, false, false); // leg L
addMesh(0.06, 0.45, 0.04, SX + 0.75, 0.25, 0.54, M.dkwood, false, false); // leg R
// TV empotrada a la pared — bezel centrado en cara interior (z=0.10)
addMesh(1.65, 0.98, 0.04, SX, 0.94, 0.10, M.dkwood, false, false); // bezel
addMesh(1.55, 0.88, 0.05, SX, 0.94, 0.13, M.tv,     false, false); // screen face

// Bookshelf on left wall
addMesh(0.3,  1.8, 0.8, -4.85, 0.9, 4.0, M.wood, true, true); // back
addMesh(0.28, 0.04, 0.78, -4.71, 0.3,  4.0, M.dkwood, false, false); // shelf 1
addMesh(0.28, 0.04, 0.78, -4.71, 0.7,  4.0, M.dkwood, false, false); // shelf 2
addMesh(0.28, 0.04, 0.78, -4.71, 1.1,  4.0, M.dkwood, false, false); // shelf 3
addMesh(0.28, 0.04, 0.78, -4.71, 1.5,  4.0, M.dkwood, false, false); // shelf 4
// Books on shelves (colored boxes)
const bookColors = [0xcc4444, 0x4444cc, 0x44aa44, 0xcc8844, 0x884488];
for (let s = 0; s < 3; s++) {
  let bz = 3.6;
  for (let b = 0; b < 5; b++) {
    const bw = 0.05 + Math.random() * 0.04;
    addMesh(0.25, 0.32, bw, -4.71, 0.5 + s * 0.4, bz + bw / 2,
      new THREE.MeshLambertMaterial({ color: bookColors[b] }), false, false);
    bz += bw + 0.01;
  }
}

// Plant next to TV, back-left corner
addMesh(0.32, 0.38, 0.32, -4.1, 0.19, 0.45, M.terra, true, false); // pot
const plant = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 10), M.green);
plant.position.set(-4.1, 0.78, 0.45);
plant.scale.y = 1.25;
plant.castShadow = true;
plant.receiveShadow = true;
scene.add(plant);
colliders.push({ minX: -4.48, maxX: -3.72, minZ: 0.07, maxZ: 0.83 });

// Painting on living room front wall
addMesh(1.05, 0.78, 0.04, -3.5, 1.9, 4.92, M.dkwood, false, false); // frame
addMesh(0.9,  0.62, 0.03, -3.5, 1.9, 4.94, M.blue,   false, false); // canvas
addMesh(0.9,  0.62, 0.03, -3.5, 1.9, 4.95, M.skyblue, false, false);

// ─── Kitchen ──────────────────────────────────────────────────────────────────
// Lower counter along right wall — fridge end (z=1.3) to front-wall corner (z=4.9)
addMesh(0.62, 0.9, 3.6, 4.69, 0.45, 3.1,  M.wood,  true, true); // cabinets
addMesh(0.66, 0.06, 3.7, 4.69, 0.93, 3.1, M.white, false, false); // countertop
// Lower counter along front wall — under kitchen window (z=5, interior z=4.9)
addMesh(1.73, 0.9, 0.62, 3.515, 0.45, 4.59, M.wood,  true, true); // cabinets
addMesh(1.77, 0.06, 0.66, 3.515, 0.93, 4.59, M.white, false, false); // countertop
// Fregadero bajo la ventana
addMesh(0.5, 0.09, 0.38, 3.75, 0.925, 4.59,
  new THREE.MeshLambertMaterial({ color: 0xbbb5ad }), false, false);
addMesh(0.03, 0.22, 0.03, 3.75, 1.07, 4.65, M.steel, false, false); // grifo base
addMesh(0.03, 0.03, 0.2,  3.75, 1.18, 4.55, M.steel, false, false); // grifo brazo
// Stove top — 6 parrillas (2 col × 3 filas)
addMesh(0.5, 0.04, 0.75, 4.71, 0.955, 2.55, M.drk, false, false);
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 2; col++) {
    const burner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.015, 16),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    burner.position.set(4.71 + (col === 0 ? -0.11 : 0.11), 0.97, 2.55 + (row - 1) * 0.24);
    scene.add(burner);
  }
}
// Campana empotrada — al ras de los gabinetes superiores (base y≈2.0)
addMesh(0.52, 0.20, 0.80, 4.64, 2.10, 2.55, M.steel, false, false); // flare (base y=2.0)
addMesh(0.38, 0.55, 0.55, 4.71, 2.53, 2.55, M.steel, false, false); // chimenea (y=2.26→2.76)

// Upper cabinets — right wall, en dos tramos dejando hueco para la campana
addMesh(0.40, 0.75, 0.85, 4.70, 2.38, 1.725, M.wood, false, false); // z=1.3→2.15
addMesh(0.40, 0.75, 1.95, 4.70, 2.38, 3.925, M.wood, false, false); // z=2.95→4.9

// Pequeño counter esquina (x=2.5→3.0) — no bloquea la puerta del lavado (x=3→4.5)
addMesh(0.5,  0.9,  0.65, 2.75, 0.45, 0.45, M.wood,  true, true);
addMesh(0.6,  0.06, 0.75, 2.75, 0.93, 0.45, M.white, false, false);

// Fridge — separada del muro z=0 para dejar libre la puerta del lavado
addMesh(0.65, 1.85, 0.75, 4.675, 0.925, 0.85, M.steel, true, true);
addMesh(0.04, 0.42, 0.04, 4.37,  1.2,   0.88, M.dkwood, false, false); // handle
// Microwave sobre refrigerador (top del fridge = y 1.85)
addMesh(0.5,  0.35, 0.38, 4.65, 2.025, 0.85, M.steel, false, false);

// ─── Recámara 1 (x[-5,0], z[-8,-3]) ──────────────────────────────────────────
// Bed: headboard contra pared trasera z=-8
addMesh(2.1,  0.22, 2.2,  -2.5, 0.11, -6.5,  M.bed,    true, false);
addMesh(2.0,  0.28, 2.0,  -2.5, 0.39, -6.5,  M.sheet,  false, false);
addMesh(2.15, 0.88, 0.12, -2.5, 0.65, -7.76, M.bed,    true, true);  // headboard
addMesh(0.65, 0.14, 0.45, -3.05, 0.57, -7.1, M.pillow, false, false);
addMesh(0.65, 0.14, 0.45, -1.95, 0.57, -7.1, M.pillow, false, false);
addMesh(1.95, 0.06, 0.9,  -2.5,  0.56, -6.1, M.blanket,false, false);
colliders.push({ minX: -3.55, maxX: -1.45, minZ: -7.72, maxZ: -5.38 });

// Nightstands — pegadas a la pared del fondo (z=-7.9) junto al cabecero
addMesh(0.5, 0.55, 0.45, -3.825, 0.275, -7.675, M.wood, true, true);
addMesh(0.5, 0.55, 0.45, -1.175, 0.275, -7.675, M.wood, true, true);

// Bedside lamps
function addLamp(x, z) {
  addMesh(0.07, 0.35, 0.07, x, 0.73, z, M.dkwood, false, false);
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 0.22, 16),
    new THREE.MeshLambertMaterial({ color: 0xf0e4c8 })
  );
  shade.position.set(x, 0.93, z);
  shade.castShadow = true;
  scene.add(shade);
  const glow = new THREE.SpotLight(0xffd090, 1.2, 3.0, Math.PI / 3.5, 0.35);
  glow.position.set(x, 0.93, z);
  glow.target.position.set(x, 0, z);
  glow.castShadow = true;
  glow.shadow.mapSize.width  = 256;
  glow.shadow.mapSize.height = 256;
  glow.shadow.camera.near = 0.1;
  glow.shadow.camera.far  = 3.0;
  glow.shadow.bias = -0.002;
  scene.add(glow);
  scene.add(glow.target);
}
addLamp(-3.825, -7.675);
addLamp(-1.175, -7.675);

// Wardrobe — pared izquierda, pegado a pared z=-3, puertas hacia el interior
addMesh(1.85, 2.4,  0.62, -4.08, 1.2,  -3.41, M.dkwood, true, true);
addMesh(0.88, 2.35, 0.04, -4.54, 1.175, -3.70, M.wood, false, false);
addMesh(0.88, 2.35, 0.04, -3.62, 1.175, -3.70, M.wood, false, false);
addMesh(0.04, 0.04, 0.05, -4.18, 1.2, -3.72, M.dkwood, false, false);
addMesh(0.04, 0.04, 0.05, -3.98, 1.2, -3.72, M.dkwood, false, false);

// Dresser — pared libre x=0 (derecha), cajones dan al cuarto (-x)
addMesh(0.52, 0.85, 1.1, -0.36, 0.425, -5.0, M.dkwood, true, true);
for (let i = 0; i < 3; i++) {
  addMesh(0.04, 0.22, 0.95, -0.63, 0.16 + i * 0.26, -5.0, M.wood, false, false);
  const knob1 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), M.dkwood);
  knob1.position.set(-0.65, 0.16 + i * 0.26, -5.0);
  scene.add(knob1);
}
// Mirror at seated height on x=0 wall (rec1 side: x < -0.1)
addMesh(0.04, 1.1, 0.72, -0.14, 1.2, -5.0, M.wframe, false, false);
addMesh(0.02, 1.0, 0.62, -0.13, 1.2, -5.0,
  new THREE.MeshLambertMaterial({ color: 0xbbddee, transparent: true, opacity: 0.65 }), false, false);
// Chair facing dresser (+x direction)
addMesh(0.5,  0.04, 0.5,  -1.1,  0.46, -5.0, M.wood, true, true);
addMesh(0.06, 0.55, 0.5,  -1.33, 0.73, -5.0, M.wood, true,  false);
addMesh(0.04, 0.46, 0.04, -0.87, 0.23, -5.23, M.dkwood, false, false);
addMesh(0.04, 0.46, 0.04, -0.87, 0.23, -4.77, M.dkwood, false, false);
addMesh(0.04, 0.46, 0.04, -1.33, 0.23, -5.23, M.dkwood, false, false);
addMesh(0.04, 0.46, 0.04, -1.33, 0.23, -4.77, M.dkwood, false, false);
colliders.push({ minX: -1.36, maxX: -0.84, minZ: -5.26, maxZ: -4.74 });

// Rug
const bedRug1 = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.2), M.bedrug);
bedRug1.rotation.x = -Math.PI / 2;
bedRug1.position.set(-2.5, 0.004, -5.8);
bedRug1.receiveShadow = true;
scene.add(bedRug1);

// Cuadro en muro z=-3 (segmento izquierdo)
addMesh(1.0,  0.72, 0.04, -4.25, 1.9, -3.12, M.dkwood, false, false);
addMesh(0.84, 0.56, 0.03, -4.25, 1.9, -3.10, M.brown,  false, false);
addMesh(0.84, 0.56, 0.03, -4.25, 1.9, -3.09, M.sand,   false, false);

// ─── Recámara 2 (x[0,5], z[-8,-3]) ───────────────────────────────────────────
// Bed
addMesh(2.1,  0.22, 2.2,   2.5, 0.11, -6.5,  M.bed,    true, false);
addMesh(2.0,  0.28, 2.0,   2.5, 0.39, -6.5,  M.sheet,  false, false);
addMesh(2.15, 0.88, 0.12,  2.5, 0.65, -7.76, M.bed,    true, true);
addMesh(0.65, 0.14, 0.45,  1.95, 0.57, -7.1, M.pillow, false, false);
addMesh(0.65, 0.14, 0.45,  3.05, 0.57, -7.1, M.pillow, false, false);
addMesh(1.95, 0.06, 0.9,   2.5,  0.56, -6.1, M.blanket,false, false);
colliders.push({ minX: 1.45, maxX: 3.55, minZ: -7.72, maxZ: -5.38 });

// Nightstands — pegadas a la pared del fondo junto al cabecero
addMesh(0.5, 0.55, 0.45,  1.175, 0.275, -7.675, M.wood, true, true);
addMesh(0.5, 0.55, 0.45,  3.825, 0.275, -7.675, M.wood, true, true);
addLamp(1.175, -7.675);
addLamp(3.825, -7.675);

// Wardrobe — pared derecha, pegado a pared z=-3, puertas hacia el interior
addMesh(1.85, 2.4,  0.62,  4.08, 1.2,  -3.41, M.dkwood, true, true);
addMesh(0.88, 2.35, 0.04,  3.62, 1.175, -3.70, M.wood, false, false);
addMesh(0.88, 2.35, 0.04,  4.54, 1.175, -3.70, M.wood, false, false);
addMesh(0.04, 0.04, 0.05,  3.98, 1.2, -3.72, M.dkwood, false, false);
addMesh(0.04, 0.04, 0.05,  4.18, 1.2, -3.72, M.dkwood, false, false);

// Dresser — pared libre x=0 (izquierda), cajones dan al cuarto (+x)
addMesh(0.52, 0.85, 1.1, 0.36, 0.425, -5.0, M.dkwood, true, true);
for (let i = 0; i < 3; i++) {
  addMesh(0.04, 0.22, 0.95, 0.63, 0.16 + i * 0.26, -5.0, M.wood, false, false);
  const knob2 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), M.dkwood);
  knob2.position.set(0.65, 0.16 + i * 0.26, -5.0);
  scene.add(knob2);
}
// Mirror at seated height on x=0 wall (rec2 side: x > 0.1)
addMesh(0.04, 1.1, 0.72, 0.14, 1.2, -5.0, M.wframe, false, false);
addMesh(0.02, 1.0, 0.62, 0.13, 1.2, -5.0,
  new THREE.MeshLambertMaterial({ color: 0xbbddee, transparent: true, opacity: 0.65 }), false, false);
// Chair facing dresser (-x direction)
addMesh(0.5,  0.04, 0.5,  1.1,  0.46, -5.0, M.wood, true, true);
addMesh(0.06, 0.55, 0.5,  1.33, 0.73, -5.0, M.wood, true,  false);
addMesh(0.04, 0.46, 0.04, 0.87, 0.23, -5.23, M.dkwood, false, false);
addMesh(0.04, 0.46, 0.04, 0.87, 0.23, -4.77, M.dkwood, false, false);
addMesh(0.04, 0.46, 0.04, 1.33, 0.23, -5.23, M.dkwood, false, false);
addMesh(0.04, 0.46, 0.04, 1.33, 0.23, -4.77, M.dkwood, false, false);
colliders.push({ minX: 0.84, maxX: 1.36, minZ: -5.26, maxZ: -4.74 });

// Rug
const bedRug2 = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.2), M.bedrug);
bedRug2.rotation.x = -Math.PI / 2;
bedRug2.position.set(2.5, 0.004, -5.8);
bedRug2.receiveShadow = true;
scene.add(bedRug2);

// Cuadro en muro z=-3 (segmento derecho)
addMesh(1.0,  0.72, 0.04, 4.0, 1.9, -3.12, M.dkwood, false, false);
addMesh(0.84, 0.56, 0.03, 4.0, 1.9, -3.10, M.blue,   false, false);
addMesh(0.84, 0.56, 0.03, 4.0, 1.9, -3.09, M.skyblue, false, false);

// ─── Baño (x[-5,-2], z[-3,0]) ─────────────────────────────────────────────────
ceilingLight(-3.5, -1.5, 0xfff8ff, 0.9, 5);

// Toilet — esquina trasera izquierda (contra muro z=-3)
addMesh(0.38, 0.55, 0.22, -4.7, 0.62, -2.78, M.white, true, false); // tank
addMesh(0.45, 0.35, 0.52, -4.7, 0.22, -2.4,  M.white, true, false); // bowl
addMesh(0.43, 0.05, 0.5,  -4.7, 0.41, -2.4,
  new THREE.MeshLambertMaterial({ color: 0xe8e8e8 }), false, false); // seat
colliders.push({ minX: -4.73, maxX: -4.27, minZ: -2.91, maxZ: -2.18 });

// Sink/lavabo — pared izquierda (x=-5), mitad frontal
addMesh(0.5,  0.82, 0.52, -4.75, 0.41, -0.7, M.white, true, true); // cabinet
addMesh(0.38, 0.1,  0.38, -4.75, 0.88, -0.7,
  new THREE.MeshLambertMaterial({ color: 0xccc8c0 }), false, false); // basin
addMesh(0.06, 0.18, 0.06, -4.95, 1.0, -0.7,
  new THREE.MeshLambertMaterial({ color: 0xb8b8b8 }), false, false); // faucet
addMesh(0.05, 0.95, 0.78, -4.86, 1.85, -0.7, M.wframe, false, false); // mirror frame
addMesh(0.03, 0.85, 0.68, -4.85, 1.85, -0.7,
  new THREE.MeshLambertMaterial({ color: 0xbbddee, transparent: true, opacity: 0.65 }), false, false);

// Shower — esquina trasera derecha (x[-3.5,-2], z[-2.9,-1.45])
addMesh(1.5, 0.08, 1.1, -3.35, 0.04, -2.3,
  new THREE.MeshLambertMaterial({ color: 0xe0e8e8 }), false, false); // tray
//addMesh(1.4, 2.5, 0.05, -3.35, 1.15, -1.78, M.glass, false, false); // front glass
addMesh(0.05, 2.5, 1.1, -4.075, 1.15, -2.3, M.glass, false, false); // side glass
addMesh(0.04, 0.04, 0.28, -3.35, 2.3, -2.86, M.steel, false, false); // arm
const showerHead = new THREE.Mesh(
  new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16), M.steel
);
showerHead.position.set(-3.35, 2.28, -2.74);
scene.add(showerHead);
addMesh(1.5, 2.3, 0.03, -2.75, 1.15, -2.92,
  new THREE.MeshLambertMaterial({ color: 0x8ec0c8 }), false, false); // accent tile

// Ventanas altas (privacidad) — pared izquierda x=-5, cerca del techo
// mismos x que winX: frame=-4.92, glass=-4.89 (interior), frame=-5.08, glass=-5.11 (exterior)
// Ventana: zona ducha (z=-2.1)
addMesh(0.08, 0.48, 0.64, -4.92, 2.34, -2.1,  M.wframe, false, false);
addMesh(0.04, 0.38, 0.54, -4.89, 2.34, -2.1,  M.glass,  false, false);
addMesh(0.04, 0.04, 0.52, -4.89, 2.34, -2.1,  M.wframe, false, false);
addMesh(0.04, 0.36, 0.04, -4.89, 2.34, -2.1,  M.wframe, false, false);
// Exterior
addMesh(0.08, 0.48, 0.64, -5.08, 2.34, -2.1,  M.wframe, false, false);
addMesh(0.04, 0.38, 0.54, -5.11, 2.34, -2.1,  M.glass,  false, false);

// ─── Cuarto de lavado (x[2.5,5], z[-3,0]) ────────────────────────────────────
ceilingLight(3.75, -1.5, 0xfff8f0, 0.8, 5);

// Lavadora — esquina trasera derecha
addMesh(0.65, 0.9,  0.65, 4.2, 0.45, -2.55, M.white, true, true);
addMesh(0.65, 0.12, 0.65, 4.2, 0.92, -2.55,
  new THREE.MeshLambertMaterial({ color: 0x888888 }), false, false);
const porthole = new THREE.Mesh(
  new THREE.CylinderGeometry(0.2, 0.2, 0.04, 24),
  new THREE.MeshLambertMaterial({ color: 0x88aacc, transparent: true, opacity: 0.65 })
);
porthole.rotation.x = Math.PI / 2;
porthole.position.set(4.2, 0.55, -2.24);
scene.add(porthole);
const portholeRing = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.22, 0.02, 24), M.steel
);
portholeRing.rotation.x = Math.PI / 2;
portholeRing.position.set(4.2, 0.55, -2.23);
scene.add(portholeRing);

// Tina de lavado — esquina trasera izquierda
addMesh(0.7, 0.85, 0.65, 3.0, 0.425, -2.55, M.white, true, true);
addMesh(0.55, 0.12, 0.5, 3.0, 0.91, -2.55,
  new THREE.MeshLambertMaterial({ color: 0xbbb5ad }), false, false);

// Alacena de almacenaje — mueble alto en pared trasera (z=-2.90), por encima de aparatos
addMesh(1.8, 0.65, 0.42, 3.75, 2.25, -2.69, M.wood, true, false);
addMesh(1.8, 0.04, 0.42, 3.75, 2.60, -2.69, M.dkwood, false, false);
addMesh(0.84, 0.60, 0.04, 3.33, 2.25, -2.48, M.dkwood, false, false);
addMesh(0.84, 0.60, 0.04, 4.17, 2.25, -2.48, M.dkwood, false, false);

// Tendedero horizontal — de pared a pared, fuera del rango de la ventana
addMesh(2.3, 0.04, 0.04, 3.75, 2.4, -0.5, M.steel, false, false);

// ─── Room labels ─────────────────────────────────────────────────────────────
function roomLabel(name, sqm) {
  const CW = 320, CH = 140;
  const canvas = document.createElement('canvas');
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d');

  const r = 14;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(CW, 0, CW, CH, r); ctx.arcTo(CW, CH, 0, CH, r);
  ctx.arcTo(0, CH, 0, 0, r);   ctx.arcTo(0, 0, CW, 0, r);
  ctx.closePath();
  ctx.fillStyle = 'rgba(10,10,10,0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,208,100,0.9)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Arial';
  ctx.fillText(name, CW / 2, CH * 0.37);
  ctx.fillStyle = '#ffd080';
  ctx.font = '25px Arial';
  ctx.fillText(sqm + ' m²', CW / 2, CH * 0.72);

  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(1.2, 0.525, 1);
  return sprite;
}

[
  { name: 'Sala / Comedor', sqm: 37.5, x: -1.25, z:  2.5 },
  { name: 'Cocina',         sqm: 12.5, x:  3.75, z:  2.5 },
  { name: 'Baño',           sqm:  9.0, x: -3.5,  z: -1.5 },
  { name: 'Pasillo',        sqm: 13.5, x:  0.25, z: -1.5 },
  { name: 'C. de Lavado',   sqm:  7.5, x:  3.75, z: -1.5 },
  { name: 'Recámara 1',     sqm: 25.0, x: -2.5,  z: -5.5 },
  { name: 'Recámara 2',     sqm: 25.0, x:  2.5,  z: -5.5 },
].forEach(({ name, sqm, x, z }) => {
  const s = roomLabel(name, sqm);
  s.position.set(x, 2.1, z);
  scene.add(s);
});

// ─── HUD ──────────────────────────────────────────────────────────────────────
const crosshair = document.createElement('div');
crosshair.style.cssText = [
  'position:fixed', 'top:50%', 'left:50%',
  'transform:translate(-50%,-50%)',
  'color:rgba(255,255,255,0.8)', 'font-size:22px',
  'font-family:monospace', 'line-height:1',
  'pointer-events:none', 'user-select:none',
  'text-shadow:0 0 4px rgba(0,0,0,0.9)',
].join(';');
crosshair.textContent = '+';
document.body.appendChild(crosshair);

const furnitureNotice = document.createElement('div');
furnitureNotice.style.cssText = [
  'position:fixed', 'top:14px', 'right:16px',
  'color:#fff', 'font-size:12px', 'font-family:sans-serif',
  'background:rgba(180,60,60,0.82)',
  'padding:7px 14px', 'border-radius:6px',
  'pointer-events:none',
  'border:1px solid rgba(255,160,160,0.5)',
  'max-width:260px', 'text-align:center',
  'line-height:1.4',
].join(';');
furnitureNotice.textContent = '⚠ Los muebles y electrodomésticos mostrados son decorativos y no están incluidos en la renta/compra.';
document.body.appendChild(furnitureNotice);

const instructions = document.createElement('div');
instructions.style.cssText = [
  'position:fixed', 'bottom:20px', 'left:50%',
  'transform:translateX(-50%)',
  'color:#fff', 'font-size:13px', 'font-family:sans-serif',
  'background:rgba(0,0,0,0.5)',
  'padding:8px 18px', 'border-radius:8px',
  'pointer-events:none', 'text-shadow:0 0 3px #000',
].join(';');
instructions.textContent =
  'Click para activar · WASD / Flechas para mover · Mouse para mirar · Esc para salir';
document.body.appendChild(instructions);

// ─── First-person controls ────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup',   e => { keys[e.code] = false; });

let yaw = 0, pitch = 0;
const RADIUS = 0.28;

renderer.domElement.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  instructions.style.display = document.pointerLockElement ? 'none' : 'block';
});

document.addEventListener('mousemove', e => {
  if (document.pointerLockElement !== renderer.domElement) return;
  yaw  -= e.movementX * 0.002;
  pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch - e.movementY * 0.002));
});

function blocked(x, z) {
  for (const c of colliders) {
    if (x + RADIUS > c.minX && x - RADIUS < c.maxX &&
        z + RADIUS > c.minZ && z - RADIUS < c.maxZ) return true;
  }
  return false;
}

// ─── Animation loop ───────────────────────────────────────────────────────────
const clock = new THREE.Clock();

(function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  const move = new THREE.Vector3();
  if (keys['KeyW'] || keys['ArrowUp'])    move.z -= 1;
  if (keys['KeyS'] || keys['ArrowDown'])  move.z += 1;
  if (keys['KeyA'] || keys['ArrowLeft'])  move.x -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) move.x += 1;
  move.normalize().multiplyScalar(4 * dt);
  move.applyEuler(new THREE.Euler(0, yaw, 0));

  const { x, z } = camera.position;
  if (!blocked(x + move.x, z))          camera.position.x += move.x;
  if (!blocked(camera.position.x, z + move.z)) camera.position.z += move.z;
  camera.position.y = 1.7;

  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  renderer.render(scene, camera);
}());

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
