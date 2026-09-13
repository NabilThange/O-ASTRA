// Spiral Cone Fidget — a print-in-place "bolt & nut": a 5-start helical SCREW
// captive inside a matching spiral-cage NUT. Twist and the screw rides the
// threads; it prints as one piece and separates by unscrewing. componentCount
// === 2. Treat 1 unit ≈ 1 mm.
//
// The trick that makes the two parts come out FREE (not fused): the clearance
// gap is built with a `loft` of constant-offset sections, so the gap stays a
// real ~0.5 mm everywhere. A plain twisted `extrude` would scale the clearance
// down to nothing at the narrow tip and weld the parts together.
const { Manifold, CrossSection, Curves } = api;
api.setCircularSegments(48);

const p = api.params({
  baseR: { type: 'number', default: 20, min: 12, max: 30, step: 0.5, unit: 'mm', label: 'Base radius' },
  height: { type: 'number', default: 55, min: 30, max: 90, step: 1, unit: 'mm', label: 'Height' },
  topScale: { type: 'number', default: 0.34, min: 0.15, max: 0.6, step: 0.02, label: 'Tip taper' },
  starts: { type: 'int', default: 5, min: 3, max: 6, step: 1, label: 'Spiral starts' },
  turns: { type: 'number', default: 1.35, min: 0.6, max: 2.0, step: 0.05, label: 'Spiral turns' },
  clearance: { type: 'number', default: 0.5, min: 0.4, max: 0.9, step: 0.05, unit: 'mm', label: 'Print clearance' },
});

const H = p.height,
  lobes = p.starts,
  R = p.baseR,
  s = p.topScale;
const twist = 360 * p.turns;
const sections = 80; // loft sections (smooth helix)
const valleyFrac = 0.42,
  peakFrac = 0.86; // inner-star core / fingertip radii

// One rounded N-lobe star cross-section (the screw's footprint).
function star(R0) {
  const valley = R0 * valleyFrac,
    peak = R0 * peakFrac;
  const steps = 120,
    pts = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const t = Math.pow(0.5 + 0.5 * Math.cos(lobes * a), 1.4); // round fingers, deep valleys
    const rr = valley + (peak - valley) * t;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return CrossSection.ofPolygons([pts]);
}

// A twisted, tapered star solid, lofted so each section can carry a CONSTANT
// in-plane offset (`grow`) — the key to constant clearance under taper.
function helixStar(R0, grow) {
  const profs = [],
    hs = [];
  for (let k = 0; k <= sections; k++) {
    const z = (k / sections) * H;
    const sc = 1 + (s - 1) * (z / H);
    let prof = star(R0).scale([sc, sc]).rotate(twist * (z / H));
    if (grow !== 0) prof = prof.offset(grow, 'Round');
    profs.push(prof);
    hs.push(z);
  }
  return Curves.loft(profs, hs);
}

const screw = helixStar(R, 0); // the bolt: 5 helical threads
const gap = helixStar(R, p.clearance); // its clearance envelope (bore)
const cone = CrossSection.circle(R, 96).extrude(H, 100, 0, s);

// Open the nut into a spiral cage: a proportionally-larger star that breaks the
// wall over the lobes (revealing the screw) yet leaves valley ribs at every
// height. Skipped below a solid base collar and above a solid top cap so all
// ribs stay joined into one piece.
const collarH = 9,
  topCap = 6;
const cageZlo = collarH,
  cageZhi = H - topCap;
const cage = helixStar(R * 1.32, 0)
  .intersect(Manifold.cube([4 * R, 4 * R, cageZhi - cageZlo], true)
    .translate([0, 0, (cageZlo + cageZhi) / 2]));

const nutRaw = cone.subtract(gap).subtract(cage);
// Keep the one connected cage+collar body; drop any rib the cage pinched off.
const nut = nutRaw.decompose().sort((a, b) => b.volume() - a.volume())[0];

return api.labeledUnion([
  { name: 'screw', shape: screw, color: '#5b7cfa' },
  { name: 'nut', shape: nut, color: '#ff7a85' },
]);
