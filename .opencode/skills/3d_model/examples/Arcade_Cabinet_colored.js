// Colors below were migrated from saved paint into code via api.paint.*
// (the model is now self-colouring; see /ai/colors.md). Edit colours here.
const __pwModel = (() => {
  const { Manifold, CrossSection, label } = api;

  // Arcade cabinet — Z-up, front faces -Y. ONE watertight solid.
  // Colorful: deep-blue side body, bright marquee, pixel-art screen, round
  // red/blue/yellow buttons, joystick, coin slot.
  function box(min, max) {
    const s = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    const c = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    return Manifold.cube(s, true).translate(c);
  }

  const HW = 9,
    FRONT = -6,
    BACK = 6,
    BODY_TOP = 34;

  // 1) Tall body spanning the full height.
  let body = box([-HW, FRONT, 0], [HW, BACK, BODY_TOP]);

  // Sloped crown: shave the top so the silhouette leans forward.
  const slope = box([-HW - 1, -10, 0], [HW + 1, 10, 12])
    .rotate([26, 0, 0])
    .translate([0, BACK + 2.0, BODY_TOP - 1.0]);
  body = body.subtract(slope);

  // 2) Screen: a shallow bezel recess, with the dark screen plate brought
  //    nearly flush to the cabinet front so the pixel-art on it reads in light.
  const sX = 6.6,
    sZlo = 18.2,
    sZhi = 27.8,
    bezel = 0.7; // shallow recess depth
  const pocket = box([-sX, FRONT - 0.1, sZlo], [sX, FRONT + bezel, sZhi]);
  body = body.subtract(pocket);
  // Screen plate: its front face sits just behind the cabinet front (-6).
  // front (more negative Y) = SCREEN_FACE; back = SCREEN_BACK (into the bezel).
  const SCREEN_FACE = FRONT + 0.05; // ≈ -5.95, essentially flush (front, min Y)
  const SCREEN_BACK = FRONT + bezel + 0.6; // ≈ -4.7 (back, max Y)
  const screen = box([-sX, SCREEN_FACE, sZlo], [sX, SCREEN_BACK, sZhi]);

  // 3) Marquee: bright header band across the top of the front, slight overhang.
  const marquee = box([-HW - 0.3, FRONT - 1.8, 28.6], [HW + 0.3, FRONT + 1.0, 33.2]);

  // 4) Control panel: forward-protruding deck below the screen, overlaps body.
  const PANEL_FRONT = -11,
    PANEL_TOP = 15;
  const panel = box([-HW, PANEL_FRONT, 11], [HW, FRONT + 1.0, PANEL_TOP]);

  // Body = main cabinet + side accents + panel, all one 'body' label except the
  // side panels which we color separately ('sidepanel').
  // Side accent stripes: thin slabs proud of each side face for a two-tone look.
  const sideL = box([-HW - 0.35, FRONT + 0.5, 2], [-HW, BACK - 0.5, BODY_TOP - 4]);
  const sideR = box([HW, FRONT + 0.5, 2], [HW + 0.35, BACK - 0.5, BODY_TOP - 4]);

  // 5) Joystick: dark stem + bright ball-top.
  const ctrlY = -8.0;
  const joyStem = Manifold.cylinder(3.2, 0.9, 0.9, 24).translate([-4.8, ctrlY, 13.5]);
  const joyBall = Manifold.sphere(1.5, 24).translate([-4.8, ctrlY, 17.2]);
  const joyBallShape = joyBall;
  const joyStemShape = joyStem;

  // 6) Buttons: three round caps overlapping the deck top, distinct colors.
  function button(x) {
    return Manifold.cylinder(1.3, 1.15, 1.15, 28).translate([x, ctrlY, 14.0]);
  }
  const btnRed = button(-0.5);
  const btnYellow = button(2.4);
  const btnBlue = button(5.3);

  // 7) Coin slot: light plate low on the front.
  const coin = box([-1.7, FRONT - 0.7, 5.5], [1.7, FRONT + 0.6, 7.4]);

  // ---------------------------------------------------------------
  // SCREEN PIXEL ART — colored thin slabs proud of the screen face.
  // A "space invader" style alien in green, plus a row of bricks above
  // and a paddle+ball below, all sitting just proud of SCREEN_FACE so
  // they fuse to the screen plate (overlap >= 0.5 in Y).
  // ---------------------------------------------------------------
  const PIX = 1.18; // pixel size — chunky, reads from afar
  const PROUD = SCREEN_FACE - 0.55; // art front face, clearly proud of the screen
  const ART_BACK = SCREEN_FACE + 0.25; // back of art, embedded into screen plate (fuses)
  const cx = 0; // screen center X
  const midZ = (sZlo + sZhi) / 2; // ~23

  // Helper: place a pixel at grid (gx, gz) relative to a center, fused to screen.
  // gz increases UPWARD. Slight gap between pixels for a crisp pixel-grid look.
  const GAP = 0.12;

  function pix(gx, gz, originX, originZ) {
    const x = originX + gx * PIX;
    const z = originZ + gz * PIX;
    const h = (PIX - GAP) / 2;
    return box([x - h, PROUD, z - h], [x + h, ART_BACK, z + h]);
  }

  function bitmap(rows, originX, originZ, ch) {
    ch = ch || '1';
    let m = null;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === ch) {
          const gx = c - (row.length - 1) / 2;
          const gz = (rows.length - 1) / 2 - r;
          const p = pix(gx, gz, originX, originZ);
          m = m ? m.add(p) : p;
        }
      }
    }
    return m;
  }

  // Space-invader alien (centered, green), filling most of the screen.
  // '1' = green body, 'E' = white eye. Classic 11-wide bitmap.
  const alienRows = [
    '..X.....X..',
    '...X...X...',
    '..XXXXXXX..',
    '.XX.XXX.XX.',
    'XXXXXXXXXXX',
    'X.XXXXXXX.X',
    'X.X.....X.X',
    '...XX.XX...',
  ];
  const alienOriginX = cx;
  const alienOriginZ = midZ - 0.4;
  const alien = bitmap(alienRows, alienOriginX, alienOriginZ, 'X');

  // Two white "eyes" proud blocks, sitting a touch more forward than the body
  // at distinct cells (cols ±2 of the eye row) so they paint cleanly.
  const EYE_FRONT = PROUD - 0.25; // slightly more proud than the body
  const eyeZ = alienOriginZ + (-1.5) * PIX; // eye row, just below center
  function eyeBlock(gx) {
    const x = alienOriginX + gx * PIX;
    const h = (PIX - GAP) / 2;
    return box([x - h * 0.7, EYE_FRONT, eyeZ - h * 0.7], [x + h * 0.7, ART_BACK, eyeZ + h * 0.7]);
  }
  const alienEyes = eyeBlock(-2).add(eyeBlock(2));

  // ---------------------------------------------------------------
  // Assemble. Label everything, then union. Art blocks overlap screen plate.
  // ---------------------------------------------------------------
  const cabinet = label(body.add(panel), 'body');

  return cabinet
    .add(label(sideL.add(sideR), 'sidepanel'))
    .add(label(marquee, 'marquee'))
    .add(label(screen, 'screen'))
    .add(label(joyStemShape, 'joystem'))
    .add(label(joyBallShape, 'joyball'))
    .add(label(btnRed, 'btnred'))
    .add(label(btnYellow, 'btnyellow'))
    .add(label(btnBlue, 'btnblue'))
    .add(label(coin, 'coinslot'))
    .add(label(alien, 'alien'))
    .add(label(alienEyes, 'alieneyes'));
})();
api.paint.label("body", [0.13, 0.18, 0.42]);
api.paint.label("sidepanel", [0.92, 0.24, 0.3]);
api.paint.label("marquee", [1, 0.78, 0.1]);
api.paint.label("screen", [0.04, 0.05, 0.09]);
api.paint.label("joystem", [0.12, 0.12, 0.14]);
api.paint.label("joyball", [0.95, 0.2, 0.22]);
api.paint.label("btnred", [0.95, 0.2, 0.22]);
api.paint.label("btnyellow", [1, 0.84, 0.1]);
api.paint.label("btnblue", [0.2, 0.55, 0.98]);
api.paint.label("coinslot", [0.78, 0.8, 0.85]);
api.paint.label("alien", [0.2, 0.95, 0.35]);
api.paint.label("alieneyes", [0.05, 0.05, 0.08]);
return __pwModel;
