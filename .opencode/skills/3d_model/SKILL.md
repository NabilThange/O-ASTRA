# 3D Modeling (Partwright Studio)

## Purpose
Build high-quality, production-ready, colored 3D models using code (JavaScript / manifold-js or OpenSCAD / BOSL2) in the browser-based parametric CAD suite: **Partwright Studio** (`https://www.partwrightstudio.com/editor`).

---

## 1. Setup & Navigation

1. **Launch Editor**:
   ```json
   browser_navigate({ "url": "https://www.partwrightstudio.com/editor" })
   ```
2. **Maximize / Fullscreen**:
   Ensure the browser window is maximized for optimal viewing of both code and 3D preview:
   ```json
   press_hotkey({ "keys": ["F11"] })
   ```
3. **Workspace Layout**:
   - **Left Pane**: Code editor (CodeMirror) where code is written in JavaScript (`manifold-js`) or OpenSCAD (`.scad`).
   - **Right Pane**: Live WebGL/Three.js interactive 3D viewport.
   - **Top Navigation Bar**: Engine/Language dropdown (`manifold-js`, `scad`, `replicad`, `voxel`), Examples gallery, and Import/Export menu.

---

## 2. Quality & Aesthetic Standards (NO Generic Models)

- **NEVER Build Primitive Soup**: A plain cube, basic unfilleted cylinder, or stack of raw spheres is strictly unacceptable.
- **Rich Geometry**: Use intentional curves, chamfers, fillets (`Curves.fillet` or `api.BREP.fillet` in JS, or `cuboid(rounding=...)` in OpenSCAD with BOSL2).
- **Organic & Figural Blends**: For organic forms, animals, characters, or figurines, use `api.sdf` with `smoothUnion` to achieve blended anatomical transitions rather than hard-edged intersections.
- **Color & Detail**: Models must incorporate color (multi-material modeling). Use labeled unions or color layers so the model has high visual contrast and distinct functional parts.
- **Coordinate Conventions**: Right-handed, Z-up. **Front is −Y, Back is +Y**. Make sure the intended front of your model (faces, buttons, screens) points toward −Y.

---

## 3. Supported Engines & Syntax

### Option A: JavaScript (`manifold-js` — Default & Recommended)
- Fastest kernel, supports algorithmic geometry, mesh smoothing, and the `Curves` & `api.sdf` namespaces.
- **Crucial Rule**: Every manifold-js script must end with a return statement:
  ```javascript
  return finalModel;
  ```
- **Example Structure**:
  ```javascript
  const { Manifold, CrossSection, Curves } = api;

  // Build base with rounded corners
  const base = Manifold.cube([60, 40, 6], true)
    .smoothOut(20)
    .refine(2);

  // Add functional features with color/labels
  const pillar = Manifold.cylinder(30, 8, 6)
    .translate([0, 0, 3]);

  return base.add(pillar);
  ```

### Option B: OpenSCAD (`scad`)
- Uses WASM OpenSCAD with the powerful **BOSL2** library bundled.
- Standard SCAD syntax (no `return` statement needed):
  ```openscad
  include <BOSL2/std.scad>

  diff()
  cuboid([50, 30, 15], rounding=3, edges="Z") {
      attach(TOP) cylinder(r=5, h=10);
  }
  ```

---

## 4. Editing, Compiling & Visual Verification

1. **Writing Code in the Editor**:
   - Click the left code editor pane using `mouse_click` or target it via `browser_click`.
   - Select all existing template code with `press_hotkey({ "keys": ["Control_L", "a"] })`.
   - Type or paste your model code.
2. **Re-compiling & Saving**:
   - Press Save hotkey to recompile and render immediately:
     ```json
     press_hotkey({ "keys": ["Control_L", "s"] })
     ```
3. **Interactive 3D Viewport Inspection (Right Pane)**:
   - Always verify your model visually from multiple angles.
   - Use `mouse_drag` across the right viewport (e.g., from `(900, 480)` to `(800, 420)`) to orbit, tilt, and examine all faces.
   - Check that:
     - No disconnected floating pieces exist.
     - Geometry is manifold and solid.
     - Proportions, bevels, and details look balanced and complete.

---

## 5. Exporting as 3MF

1. On the top-right toolbar of Partwright Studio, locate and click the **Export** menu button.
2. Select **3MF** (`.3mf` format).
   - 3MF preserves multi-part color data, exact geometry, and print-ready units.
3. Verify download in `/home/user/Downloads/` or move the exported `.3mf` file to `/home/user/Desktop/` for user inspection.

---

## 6. Documentation & Example Code References

- **Full AI Instructions**: Read the comprehensive local reference guide at:
  `.opencode/skills/3d_model/ai.md` (or `/app/.opencode/skills/3d_model/ai.md`)
  Contains detailed reference for `Curves`, `api.sdf`, `api.BREP`, fasteners, joints, gears, threads, and printability checks.
- **Example Code Directory**: Read or copy ready-to-run examples in:
  `.opencode/skills/3d_model/examples/`
