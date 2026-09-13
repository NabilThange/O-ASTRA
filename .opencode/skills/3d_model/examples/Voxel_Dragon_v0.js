// Voxel Dragon — a cute-but-cool seated dragon.
// Symmetric about x=0 (build +x half, mirror). HEAD/face on -Y toward the
// catalog camera. Z-up, sits on z=0. Emerald scales, cream belly, bone horns.
const { voxels } = api;
const v = voxels();

// ---- palette ----
const EMER = '#2faa55'; // emerald scales (main)
const EMER_D = '#1f7d3d'; // shadow emerald (+X outer / undersides)
const EMER_L = '#5ccf80'; // highlight emerald (tops / back ridge)
const CREAM = '#f2e6bd'; // belly / chest
const CREAM_D = '#d8c994'; // belly shadow
const BONE = '#efe6cf'; // horns / spikes / claws
const BONE_D = '#cbbf9e';
const ORANGE = '#ff9f3f'; // accent spike tips
const EYE_W = '#ffffff';
const EYE_B = '#16241c'; // dark pupil
const NOSE = '#143322'; // nostril

function box(a, b, c) { v.fillBox(a, b, c); }

// ============ BODY (plump rounded torso, seated, sits back +Y) ============
// body x:0..4, y:-1..5, z:1..9
box([0, -1, 1], [4, 5, 9], EMER);
box([4, -1, 1], [4, 5, 9], EMER_D); // side shadow
box([0, -1, 9], [4, 5, 9], EMER_L); // top ridge highlight
// round lower-back corners
v.remove(4, 5, 1);
// cream belly plate (front-bottom, -Y)
box([0, -2, 2], [2, -2, 7], CREAM);
v.set(0, -2, 4, CREAM_D);
v.set(1, -2, 6, CREAM_D);

// ============ HIND HAUNCH (seated) ============
box([3, 3, 0], [5, 6, 3], EMER_D); // thigh haunch
box([3, 3, 3], [5, 5, 3], EMER); // haunch top catches light
box([3, 2, 0], [4, 2, 1], BONE); // hind clawed toes forward

// ============ FRONT LEG (little arms resting in front) ============
box([1, -3, 0], [2, -1, 3], EMER); // front leg
box([1, -3, 3], [2, -2, 3], EMER_L);
box([1, -4, 0], [2, -3, 1], BONE); // front clawed foot

// ============ NECK + CHEST (rises toward head) ============
box([0, -2, 9], [2, 1, 12], EMER); // neck
box([2, -2, 9], [2, 1, 12], EMER_D);
box([0, -3, 9], [1, -3, 11], CREAM); // chest cream continues up

// ============ HEAD ============
// head x:0..3, y:-4..1, z:12..16
box([0, -4, 12], [3, 1, 16], EMER);
box([3, -4, 12], [3, 1, 16], EMER_D); // head side shadow
box([0, -4, 16], [3, 1, 16], EMER_L); // head top highlight
// snout pokes forward (-Y), lower
box([0, -6, 12], [2, -5, 14], EMER);
box([0, -6, 12], [2, -5, 12], CREAM_D); // snout underside (jaw)
// nostrils on snout front face
v.set(1, -6, 13, NOSE);
// big friendly eyes — white block with a single dark pupil, on head front (-Y)
box([1, -5, 14], [2, -5, 15], EYE_W);
v.set(2, -5, 14, EYE_B); // pupil (lower-outer)
// brow ridge over the eye for a "cool" look
v.set(1, -5, 16, EMER_D);
v.set(2, -5, 16, EMER_D);

// ============ HORNS (bone, swept up and back) ============
v.set(2, 0, 16, BONE);
v.set(2, 0, 17, BONE);
v.set(2, 1, 17, BONE); // bridge: keeps the swept tip fused
v.set(2, 1, 18, BONE_D); // horn curves back
v.set(2, 1, 19, ORANGE); // horn tip accent
// small brow horn ridge
v.set(1, -3, 16, BONE_D);

// ============ CHEEK FRILL ============
box([3, -1, 13], [3, 0, 15], EMER_L);

// ============ WINGS (folded against the back, swept up) ============
box([4, 1, 5], [4, 4, 10], EMER_D); // wing base membrane
box([5, 1, 7], [5, 3, 12], EMER); // wing rises
box([5, 1, 12], [5, 2, 14], EMER_L); // wing tip
box([5, 3, 9], [5, 4, 9], BONE_D); // wing claw nub
v.set(5, 1, 14, ORANGE); // wing tip spike accent

// ============ TAIL (curves out the back, tapering, spiked) ============
box([0, 5, 1], [1, 7, 3], EMER); // tail base
box([0, 7, 1], [1, 8, 2], EMER_D); // tail mid
box([0, 8, 0], [0, 10, 1], EMER); // tail tip
v.set(0, 10, 1, ORANGE); // tail tip accent
// dorsal spikes (warm bone, along the back ridge — sit on the centerline)
v.set(0, 6, 4, ORANGE);
v.set(0, 4, 7, BONE);
v.set(0, 2, 9, ORANGE);
v.set(0, 0, 11, BONE);
v.set(0, -1, 13, ORANGE); // crown spike between horns

// mirror across x for a symmetric dragon
v.mirror('x');

return v;
