// Voxel Steam Locomotive — a cute, classic 4-4-0 "American" style steam engine.
// Z-up, sits on z=0. The train runs along X with the FRONT (cowcatcher, stack,
// smoke) toward -X and the CAB toward +X. The whole left side faces -Y so the
// catalog 3/4 camera (looking toward +Y/+X) sees the boiler side, the big red
// driving wheels, the connecting rods, the dome, the funnel and the smoke puff.
const { voxels } = api;
const v = voxels();

// ---------- palette ----------
const BOILER = '#1f6e3c'; // deep loco green boiler barrel
const BOILER_D = '#155029'; // shadow green
const BOILER_L = '#2f9152'; // highlight green
const BLACK = '#202326'; // smokebox / footplate / chassis
const BLACK_L = '#33383d';
const BRASS = '#d7a83a'; // boiler bands, dome, whistle, trim
const BRASS_L = '#f2cf6a';
const RED = '#c0392b'; // wheels / cab roof / cowcatcher
const RED_D = '#8e2a20';
const RED_L = '#e0584a';
const SILVER = '#9aa7b4'; // rods / running gear / buffers
const SILVER_L = '#c7d1da';
const CAB_WOOD = '#7a4a24'; // cab body (varnished wood)
const CAB_WD_L = '#a06532';
const GLASS = '#bfe7ff'; // windows
const SMOKE = '#e8eaec'; // smoke puff
const SMOKE_D = '#c4c8cc';
const FIRE = '#ff7a1a'; // firebox glow

function box(a, b, c) { v.fillBox(a, b, c); }

// =====================================================================
// CHASSIS / FOOTPLATE  (runs the length of the loco along X)
//   X:  -14 (front buffer beam) .. 16 (back of cab)
//   Y:  -4 .. 4   (5 wide)
//   running boards sit at z = 2..3
// =====================================================================
box([-13, -4, 2], [15, 4, 3], BLACK); // main footplate / frame
box([-13, -4, 2], [15, -4, 3], BLACK_L); // -Y edge highlight (camera side)
box([-13, 4, 2], [15, 4, 3], BLACK_L); // +Y edge

// =====================================================================
// BOILER BARREL  (a long cylinder along X, sitting above the wheels)
//   center y=0, z=8 ; radius 4 ; from x=-10 (smokebox) to x=8
// =====================================================================
for (let x = -10; x <= 8; x++) {
  v.cylinder([x, 0, 8], 4, 1, BOILER, 'x');
}
// shade the boiler: darker on +Y far side, lighter on top
for (let x = -10; x <= 8; x++) {
  for (let y = -4; y <= 4; y++) {
    for (let z = 4; z <= 12; z++) {
      if (!v.has(x, y, z)) continue;
      if (z >= 11) v.set(x, y, z, BOILER_L); // top highlight
      else if (y >= 3) v.set(x, y, z, BOILER_D); // far-side shadow
    }
  }
}

// brass boiler bands
for (const bx of [-6, -2, 2, 6]) {
  v.cylinder([bx, 0, 8], 4, 1, BRASS, 'x');
}
// keep band tops bright
for (const bx of [-6, -2, 2, 6]) {
  for (let y = -4; y <= 4; y++)
    for (let z = 11; z <= 12; z++)
      if (v.has(bx, y, z)) v.set(bx, y, z, BRASS_L);
}

// =====================================================================
// SMOKEBOX  (black drum at the front of the boiler) + smokebox door
// =====================================================================
for (let x = -13; x <= -10; x++) {
  v.cylinder([x, 0, 8], 4, 1, BLACK, 'x');
}
for (let x = -13; x <= -10; x++) {
  for (let y = -4; y <= 4; y++)
    for (let z = 11; z <= 12; z++)
      if (v.has(x, y, z)) v.set(x, y, z, BLACK_L);
}
// round smokebox door (front face, -X) with brass hinge dot
for (let y = -3; y <= 3; y++)
  for (let z = 5; z <= 11; z++) {
    if (y * y + (z - 8) * (z - 8) <= 11) v.set(-14, y, z, BLACK_L);
  }
v.set(-14, 0, 8, BRASS_L); // central dog/handle
v.set(-14, 1, 9, BRASS);

// =====================================================================
// FUNNEL / SMOKESTACK  (classic flared diamond stack at the front top)
// =====================================================================
v.cylinder([-11, 0, 12], 2, 3, BLACK, 'z'); // stack base
v.cylinder([-11, 0, 15], 3, 1, BLACK_L, 'z'); // flared cap rim
v.cylinder([-11, 0, 15], 2, 1, BLACK, 'z'); // mouth
v.set(-11, 0, 16, BLACK_L);

// =====================================================================
// STEAM DOME  (brass dome midway along the boiler)
// =====================================================================
v.sphere([-3, 0, 13], 2, BRASS);
v.cylinder([-3, 0, 12], 2, 1, BRASS_L, 'z'); // dome base ring
v.set(-3, 0, 15, BRASS_L); // dome top shine

// SAND DOME (smaller brass dome) + whistle/safety valve
v.sphere([2, 0, 13], 1, BRASS);
v.set(2, 0, 14, BRASS_L);
v.set(5, 0, 13, BRASS); // whistle stalk
v.set(5, 0, 14, BRASS_L);

// steam pipe / handrail along the boiler side (-Y, camera side)
for (let x = -9; x <= 7; x++) v.set(x, -4, 11, BRASS_L);

// =====================================================================
// CAB  (crew cab at the back, varnished wood with windows + red roof)
//   X: 8..15 ; full-ish width ; sits on footplate
// =====================================================================
box([8, -4, 4], [15, 4, 14], CAB_WOOD); // cab body
box([8, -4, 4], [15, -4, 14], CAB_WD_L); // -Y face (camera side)
// hollow it a touch at the front so it meets the boiler nicely (boiler pokes in)
// (boiler already overlaps x=8, so they connect)

// side windows (camera side -Y) — two square windows
box([10, -4, 9], [11, -4, 12], GLASS);
box([13, -4, 9], [14, -4, 12], GLASS);
// far side windows too (for symmetry / + Y)
box([10, 4, 9], [11, 4, 12], GLASS);
box([13, 4, 9], [14, 4, 12], GLASS);
// back wall window (the +X end)
box([15, -2, 9], [15, 2, 12], GLASS);

// red cab roof, slightly overhanging
box([7, -5, 15], [16, 5, 15], RED);
box([7, -5, 16], [16, 5, 16], RED_L);
// firebox glow peeking under the cab front
box([8, -3, 4], [8, 3, 6], FIRE);

// =====================================================================
// COWCATCHER / PILOT  (the angled grille at the very front, -X)
//   A broad red wedge that fans out wider than the loco and rakes down to
//   the rail — placed in FRONT of the leading wheels so the camera sees it.
// =====================================================================
box([-15, -4, 1], [-15, 4, 5], RED); // pilot beam (full width)
box([-16, -3, 1], [-16, 3, 4], RED); // step 1
box([-17, -3, 1], [-17, 3, 3], RED_L); // step 2 (lighter face)
box([-18, -2, 1], [-18, 2, 2], RED_D); // step 3
v.set(-19, 0, 1, RED_L); // pointed tip
// vertical grille slats (silver) raked across the wedge
for (let y = -3; y <= 3; y += 2) { v.set(-16, y, 2, SILVER_L);
  v.set(-17, y, 2, SILVER); }
// buffers
v.set(-16, -4, 5, SILVER_L); // buffer (camera side)
v.set(-16, 4, 5, SILVER);
// big brass headlamp perched on the smokebox front, clearly visible
box([-15, -1, 12], [-14, 1, 14], BRASS); // lamp housing
v.set(-15, 0, 13, '#fff7d6'); // lamp lens (glow, faces -X)
v.set(-14, 0, 15, BRASS_L); // lamp top
v.set(-13, 0, 13, BRASS_L); // bracket to smokebox

// =====================================================================
// WHEELS + RUNNING GEAR
//   Big red driving wheels along the lower side; small leading-truck
//   wheels under the smokebox. Built on the -Y (camera) side and mirrored
//   to +Y. Wheels are face-connected to the chassis via the axle so the
//   model bakes to ONE component.
// =====================================================================
function wheel(cx, radius, color, rim) {
  // a disc in the X-Z plane at y = -4 (camera side)
  for (let x = cx - radius; x <= cx + radius; x++) {
    for (let z = 0; z <= 2 * radius; z++) {
      const dx = x - cx,
        dz = z - radius;
      const d2 = dx * dx + dz * dz;
      if (d2 <= radius * radius) {
        v.set(x, -4, z, (d2 >= (radius - 1) * (radius - 1)) ? rim : color);
      }
    }
  }
  // hub
  v.set(cx, -4, radius, SILVER_L);
  // axle bridges the wheel to the frame so it's face-connected (-> 1 component)
  for (let y = -4; y <= 4; y++) v.set(cx, y, radius, SILVER);
  // mirror wheel disc onto far side (+Y) too
  for (let x = cx - radius; x <= cx + radius; x++) {
    for (let z = 0; z <= 2 * radius; z++) {
      const dx = x - cx,
        dz = z - radius;
      const d2 = dx * dx + dz * dz;
      if (d2 <= radius * radius) {
        v.set(x, 4, z, (d2 >= (radius - 1) * (radius - 1)) ? rim : color);
      }
    }
  }
  v.set(cx, 4, radius, SILVER_L);
}

// two big driving wheels (radius 3) under the firebox/boiler
wheel(2, 3, RED, RED_L);
wheel(10, 3, RED, RED_L);
// two small leading wheels (radius 2) under the smokebox
wheel(-9, 2, RED_D, RED_L);
wheel(-4, 2, RED_D, RED_L);

// CONNECTING ROD — silver bar linking the two big driver hubs (camera side)
for (let x = 2; x <= 10; x++) v.set(x, -5, 3, SILVER_L);
v.set(2, -5, 3, SILVER);
v.set(10, -5, 3, SILVER); // big-end bosses
// crank pins connecting rod -> wheel face so the rod isn't a floating island
v.set(2, -4, 3, SILVER);
v.set(2, -5, 4, SILVER_L);
v.set(10, -4, 3, SILVER);
v.set(10, -5, 4, SILVER_L);
// piston / cylinder block at the front of the rod run
box([-2, -5, 3], [0, -4, 5], SILVER);
v.set(-1, -5, 4, SILVER_L);

// =====================================================================
// SMOKE PUFF  (a billowing cloud rising from the funnel; bridged to the
//   stack with a thin column so it stays ONE connected component)
// =====================================================================
v.line([-11, 0, 17], [-11, 0, 19], SMOKE_D); // bridge column from stack
v.sphere([-11, 0, 21], 2, SMOKE);
v.sphere([-9, 1, 24], 2, SMOKE);
v.sphere([-12, -1, 24], 1, SMOKE_D);
v.sphere([-7, 0, 26], 2, SMOKE);
v.sphere([-9, 1, 28], 1, SMOKE_D);
// connect the puff balls to each other so the cloud is one blob
v.line([-11, 0, 21], [-9, 1, 24], SMOKE_D);
v.line([-9, 1, 24], [-7, 0, 26], SMOKE_D);
v.line([-7, 0, 26], [-9, 1, 28], SMOKE);

return v;
