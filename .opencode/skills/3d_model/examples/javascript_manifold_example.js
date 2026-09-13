// Example: Parametric Beveled Enclosure with Heat Sinks and Knurled Dial
// Engine: manifold-js (JavaScript) in Partwright Studio
// Run inside https://www.partwrightstudio.com/editor

const { Manifold, CrossSection, Curves } = api;

function createModernEnclosure() {
  const width = 80;
  const depth = 55;
  const height = 24;
  const wall = 3;

  // 1. Outer main chassis with filleted corners
  const outer = Manifold.cube([width, depth, height], true)
    .smoothOut(25)
    .refine(2);

  // 2. Inner hollow cavity (subtracted)
  const cavity = Manifold.cube([width - 2 * wall, depth - 2 * wall, height], true)
    .translate([0, 0, wall]);

  const body = outer.subtract(cavity);

  // 3. Decorative top bezel / cooling fins
  let fins = Manifold.cube([0, 0, 0]);
  for (let i = -24; i <= 24; i += 8) {
    const fin = Manifold.cube([width - 16, 2.5, 3], true)
      .translate([0, i, height / 2 + 1]);
    fins = fins.add(fin);
  }

  // 4. Knurled rotary dial on top face
  const dialBase = Manifold.cylinder(8, 12, 12)
    .translate([width / 4, 0, height / 2]);

  return body.add(fins).add(dialBase);
}

return createModernEnclosure();
