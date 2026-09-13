Title: Live Content

Description: Fetched live

Source: https://www.partwrightstudio.com/ai.md

---

# Partwright -- AI Agent Instructions

Partwright is a browser-based parametric CAD tool with four modeling engines: **manifold-js** (default, JavaScript DSL with manifold-3d API + a `Curves` helper namespace), **OpenSCAD** (SCAD language via WASM, with BOSL2 bundled), **BREP / replicad** (JavaScript with `api.BREP.*` — OpenCASCADE B-rep for exact fillets/chamfers and STEP export), and **voxel** (JavaScript — blocky colored-cube modeling for pixel-art and image-derived models; see `/ai/voxel.md`). You write code that constructs 3D geometry, which renders live. All interaction is via the `window.partwright` programmatic API -- do not drive the app through clicks or keystrokes. `window.mainifold` remains available as a legacy alias for older prompts.

**Coordinate system:** Right-handed, Z-up. XY plane is the ground. **Front = −Y, back = +Y** — the Front view and the interactive viewport both sit on the −Y side looking toward +Y, so a model's intended front face (a character's face, a screen, a door) must have its outward normal pointing toward −Y. (−Y is also the slicer build-plate front, so a −Y-facing model exports facing forward.) Right = +X, left = −X. Units are arbitrary.

## Contents

- [Before you start](#before-you-start)
- [Choosing an engine](#choosing-an-engine)
- [What do I do for X? (verb decision tree)](#what-do-i-do-for-x-verb-decision-tree)
- [Topic index (subdocs)](#topic-index-subdocs)
- [Common agent mistakes](#common-agent-mistakes)
- [Argument validation](#argument-validation)
- [Console API -- window.partwright](#console-api--windowpartwright)
- [Geometry data](#geometry-data)
- [Writing model code (manifold-js)](#writing-model-code-manifold-js)
- [Writing OpenSCAD code](#writing-openscad-code)
- [Common pitfalls for boolean operations](#common-pitfalls-for-boolean-operations)
- [Common gotchas](#common-gotchas)
- [Iteration workflow](#iteration-workflow)
- [Stat-based verification](#stat-based-verification)
- [Printability](#printability)
- [Visual verification](#visual-verification)
- [Spending mode](#spending-mode)

## Before you start

1. **Use `window.partwright`** -- that's the programmatic API. Do NOT drive the app with clicks, keystrokes, or DOM manipulation.
2. **Pick your engine:** manifold-js (default) or OpenSCAD. See [Choosing an engine](#choosing-an-engine).
3. **Match the construction *method* to the subject before you write code — and say which and why.** Picking a method whose ceiling is below the goal is the most expensive mistake you can make, and it's diagnosable up front, not in hindsight. The biggest trap is **organic / figural subjects** — a figurine, character, person, animal, creature, bust, or any anatomical body. A `union` of constant-radius spheres and capsules has a hard ceiling for these (every limb is a tube, every joint a visible ball — "primitive soup"), so reach for **`api.sdf` smooth blends (`smoothUnion` / `displace`)** instead → [`readDoc("sdf")`](#topic-index-subdocs). Route on the request's *kind* the same way "exact fillet → BREP" already does: keywords *smooth, organic, blended, figurine, character, creature, body, sculpt* → SDF; mechanical exact edges → BREP; flat colour tile / keychain from an image → relief; blocky / pixel-art → voxel. The success bar for a figure is **resemblance**, not just `isManifold` — for any hard or unfamiliar subject, spend 3 lines on an SDF proof-of-concept to confirm the method can reach the look *before* committing to a full build, then compare your render against the reference (or the described goal) before you call it done.
4. **manifold-js code must end with `return manifoldObject;`** -- a bare trailing expression won't work. OpenSCAD code uses standard SCAD syntax (no `return`).
5. **Use `runAndSave(code, label, {isManifold: true, maxComponents: 1})`** to validate and commit a version.
6. **Verify visually after structural changes.** Stats alone can't catch warped roofs, twisted spires, or wrong proportions. Call `renderViews()` to see several angles at once, and `renderViews({views: "box"})` for a guaranteed all-faces check before declaring done. For a figure or anything whose goal is resemblance, judge the render against the reference image, not just against "is it manifold." See [Visual verification](#visual-verification).
7. **Log decisions with `addSessionNote("[PREFIX] ...")`** -- prefixes: `[REQUIREMENT]`, `[DECISION]`, `[FEEDBACK]`, `[MEASUREMENT]`, `[ATTEMPT]`, `[TODO]`.
8. **`await` every async method.** `createSession`, `runAndSave`, `runAndAssert`, `runIsolated`, `runAndExplain`, `loadVersion`, `forkVersion`, `getSessionContext`, every `*Data()` export, every notes/sessions call returns a Promise. Without `await` you'll inspect the Promise object instead of the result and silently work from stale or empty data.

## Choosing an engine

Partwright supports four modeling engines. The table below covers the three solid/CSG engines; the fourth, **voxel**, is a blocky colored-cube engine for pixel-art and image-derived models (`return api.voxels()…`) — see `/ai/voxel.md`. Pick whichever is best for the task:

| | **manifold-js** (default) | **OpenSCAD** (SCAD) | **BREP / replicad** |
|---|---|---|---|
| Language | JavaScript | OpenSCAD `.scad` | JavaScript (`api.BREP.*`) |
| Kernel | manifold-3d mesh | OpenSCAD CSG | OpenCASCADE B-rep |
| Best for | Algorithmic geometry, smooth curves, mesh-level ops (`warp`/`levelSet`/`smoothOut`), painting | Mechanical parts with BOSL2 (threads, gears, attachables), porting existing `.scad` files | True edge fillets/chamfers, exact surfaces, STEP export, mechanical-CAD interop |
| Code style | `return Manifold.cube([10,10,10], true);` | `cube([10,10,10], center=true);` | `return BREP.box([10,10,10]).fillet(2);` |
| Unique strengths | `Curves.loft/sweep/naca4`; `api.text()`; `api.gears`/`api.threads` (involute gears, ISO threads); `levelSet`/`warp`/`smoothOut` (mesh-level) | BOSL2's `cuboid(rounding=)`, `skin()`, `path_sweep()`, `threaded_rod()`, `spur_gear()` | Exact `fillet()`/`chamfer()`, `.blobSTEP()` export, BREP shapes survive across runs |
| Limitations | Must learn the manifold-3d API | Slower per-run (~100-300ms WASM init); `text()` shares same Liberation Sans fonts as manifold-js | No `warp`/`levelSet`; no `Curves` helpers; 10 MB WASM lazy-load on first use |

**Crucial:** You can ALSO use the BREP namespace **inside a manifold-js session** without switching languages — `api.BREP.box(...).fillet(r)`, then `api.BREP.toManifold(shape, api.Manifold)` to drop back into the Manifold world. This is the right move for "one feature needs an exact fillet" without committing to a BREP-only session. Switch to the **replicad** language only when you need STEP export of the *combined* shape, or when the part is dominated by BREP operations. See `/ai/replicad.md` for the full BREP API.

### Switching engines

```js
partwright.getActiveLanguage()        // -> 'manifold-js' or 'scad' or 'replicad' or 'voxel'
await partwright.setActiveLanguage('scad')
await partwright.setActiveLanguage('manifold-js')
await partwright.setActiveLanguage('replicad')
await partwright.setActiveLanguage('voxel')
```

Switching is non-destructive. Your in-progress code in the previous language is stashed as a per-session draft and restored when you switch back — both languages stay live until the session is deleted. Saved versions are not touched; each version remembers the language it was authored in, and navigating to one auto-swaps the engine. A single session can hold mixed manifold-js + SCAD versions.

Selecting a SCAD example from the toolbar dropdown auto-switches to OpenSCAD mode.

## What do I do for X? (verb decision tree)

Reach for the right tool the first time. If the table sends you to a subdoc, fetch it before writing code.

| Want | manifold-js | OpenSCAD | BREP (`api.BREP.*`) |
|---|---|---|---|
| Cube / sphere / cylinder | `Manifold.cube/sphere/cylinder(...)` | `cube()`, `sphere()`, `cylinder()` | `BREP.box([w,d,h])`, `BREP.sphere(r)`, `BREP.cylinder(r, h)` |
| Boolean union / difference / intersection | `.add(o)`, `.subtract(o)`, `.intersect(o)` | `union(){...}`, `difference(){...}`, `intersection(){...}` | `.fuse(o)` / `.cut(o)` / `.intersect(o)`, or `BREP.fuseAll([a,b,c])` / `BREP.cutAll([body,…holes])` / `BREP.intersectAll([…])` for N-way |
| Expose tweakable knobs (make it customizable) | `api.params({...})` at the top → live Parameters panel; `partwright.getParams()`/`setParams({...})` to drive | top-level vars + OpenSCAD customizer annotations (`x = 30; // [10:100]`) → same panel | `api.params({...})` — same as manifold-js (also works in voxel sessions) |
| 2D shape extruded to 3D | `cs.extrude(h, nDiv?, twist?, scaleTop?)` | `linear_extrude(h, twist=, slices=, scale=) polygon(...)` | (use manifold-js + BREP for one piece) |
| Surface of revolution (vase, lens, bottle) | `cs.revolve(n?, degrees?)` | `rotate_extrude(angle=) polygon(...)` | (use manifold-js) |
| Smooth curve from a few points | `Curves.bezier(controls)` -> `/ai/curves.md` | `bezier_curve()` (BOSL2) -> `/ai/bosl2.md` | (use manifold-js Curves) |
| Arc between two points | `Curves.arc({from, to, radius})` | `arc()` (BOSL2) | (use manifold-js Curves) |
| Airfoil cross-section | `Curves.naca4("2412")` | (write your own with BOSL2 paths) | (use manifold-js Curves) |
| Polygon with rounded corners | `Curves.polyline(points, {fillet: r})` | BOSL2 `round_corners(...)` | (use manifold-js Curves) |
| Wing, hull, fuselage (varying profile along axis) | `Curves.loft([profA, profB], [zA, zB])` -> `/ai/curves.md` | BOSL2 `skin([profiles], z=, slices=)` -> `/ai/bosl2.md` | (use manifold-js Curves) |
| Handle, tube, propeller (profile along 3D path) | `Curves.sweep(profile, pathPoints)` | BOSL2 `path_sweep(profile, path)` | (use manifold-js Curves) |
| Ribbed / fluted / threaded / corrugated tube — texture that FLOWS along the path (incl. branching organic shapes like a cactus) | **`api.sdf.tube(path, radius, {profile:'flutes'\|'rings'\|'helix'})` -> `/ai/sdf.md#tube`** (continuous through bends; `smoothUnion` several for a branching body — don't hand-roll with `warp`/`displace`) | BOSL2 `path_sweep` of a fluted profile | (use manifold-js sdf) |
| Revolve around an arbitrary axis | `Curves.revolveAxis(profile, [ax,ay,az])` | `rotate([...]) rotate_extrude() polygon()` | (use manifold-js Curves) |
| 3D text / embossed label | **`api.text("Hi", {size, height, font, spacing, center})` → Manifold** (Liberation Sans; fonts lazy-loaded ~1.6 MB on first use); `api.textSection(...)` → CrossSection for custom extrusion | `text("Hi", size=10, font="Liberation Sans:style=Regular")` | (use manifold-js) |
| Round/chamfer all sharp edges of a solid | `Curves.fillet(solid, {angle: 60})` (mesh-smoothing) | BOSL2 `cuboid(rounding=...)`, `round3d(...)` | **`.fillet(radius)` / `.chamfer(distance)` -> `/ai/replicad.md` (exact, BREP-true)** |
| Round/chamfer ONLY specific edges (e.g. top rim only) | (not available) | BOSL2 `edge_profile()` (rough) | **`.fillet(r, {minZ, maxZ, nearPoint+withinDist, parallelToPlane, inDirection})` — selective, BREP-only. See `/ai/replicad.md` for the full EdgeFilter.** |
| STEP export | (not available) | (not available) | **`partwright.exportSTEP()` after a BREP-language run -> `/ai/replicad.md`** |
| STEP import (read a `.step` / `.stp` file as a CAD shape) | (use partwright.importFile UI, choose manifold-js — tessellates) | (not available) | **partwright.importFile UI, choose BREP — preserves exact surfaces. `api.imports[0]` in the replicad sandbox is the BrepShape.** |
| Ring/linear/mirror copies | `api.circularPattern / linearPattern / mirrorCopy` (or `Curves.ringCopy / linearCopy / mirrorCopy`) | BOSL2 `ring_copies()`, `xcopies()`, `mirror_copy()` | (use manifold-js helpers) |
| Place A on top of B (no mental trig) | `api.placeOn(a, b, {gap?, at?})` | BOSL2 attachments: `attach(TOP, BOTTOM)` | (use manifold-js — convert BREP→Manifold first) |
| Align A's edge/face to B (per axis) | `api.alignTo(a, b, {x?, y?, z?})` (min/max/center) | BOSL2 `position()`/`anchor()` | (use manifold-js — convert BREP→Manifold first) |
| Do two shapes overlap? Volume change? | `api.intersects(a, b)`, `api.volumeDelta(a, b)` | (no equivalent; render and check stats) | (use manifold-js — convert BREP→Manifold first) |
| Is a point inside the solid? | `api.pointInside(m, [x,y,z])` | (no equivalent) | (use manifold-js — convert BREP→Manifold first) |
| Did my boolean give the expected component count? | `api.expectUnion(parts, {expectComponents})` | (no equivalent — check stats `componentCount` after run) | (use manifold-js — convert BREP→Manifold first) |
| Per-piece bbox + volume (find leaked components) | `api.componentBounds(m)` or window `partwright.componentBounds()` | `partwright.componentBounds()` (window API, works for SCAD too) | `partwright.componentBounds()` (window API — works on tessellated mesh) |
| Repair a non-manifold mesh after a failing boolean / STL import | `api.heal(m)` (or window `partwright.healCurrent()`) | `partwright.healCurrent()` (window API) | `partwright.healCurrent()` (works on tessellated mesh) |
| Cross-section image (any axis, for debugging cavities) | `partwright.renderSection({axis, offset?, size?})` | `partwright.renderSection(...)` — same window API | `partwright.renderSection(...)` — same window API |
| Threaded rod / bolt / nut | `api.threads.rod/bolt/nut({size:"M8", length})` -> `/ai/threads.md` | BOSL2 `threaded_rod()`, `screw()`, `nut()` | (use manifold-js threads) |
| Spur gear / meshing gear pair / rack | `api.gears.spur/pair/rack({module, teeth, thickness})` -> `/ai/gears.md` | BOSL2 `spur_gear()`, `bevel_gear()`, `worm_gear()` | (use manifold-js gears; bevel/worm not yet) |
| Clearance or tap hole sized to a real screw (M2–M8) | `api.fasteners.screwHole({size:"M3", length, head})` / `api.fasteners.tapHole({size:"M3", length})` → subtract -> `/ai/fasteners.md` | BOSL2 `screw_hole()` | (use manifold-js fasteners) |
| Heat-set insert boss | `api.fasteners.insertBoss({size:"M3"})` → union -> `/ai/fasteners.md` | (write a tapered bore manually) | (use manifold-js fasteners) |
| Captive / clearance nut pocket | `api.fasteners.nutPocket({size:"M3", captive:true})` → subtract -> `/ai/fasteners.md` | BOSL2 `nut_trap_side()` | (use manifold-js fasteners) |
| Snap-fit, dovetail, or alignment-pin joint | `api.joints.snapFit/dovetail/pin/socket(...)` -> `/ai/joints.md` | (build manually) | (use manifold-js joints) |
| Print-in-place hinge / ball joint / press-on lid rim | `api.joints.hinge/ballSocket/snapRim(...)` -> `/ai/joints.md` | (build manually) | (use manifold-js joints) |
| Two-part project box / enclosure (lip or screw lid) | `api.enclosure.box({size:[x,y,z], type:'lip'\|'screw'})` → `{base, lid}` -> `/ai/enclosure.md` | (build manually) | (use manifold-js enclosure) |
| Rounded shell / PCB standoff post | `api.enclosure.shell({size})` / `api.enclosure.standoff({size:"M3"})` -> `/ai/enclosure.md` | (build manually) | (use manifold-js enclosure) |
| Knurled grip (diamond / straight / ribs) on a knob or handle | `api.knurl.diamond/straight/ribs({diameter, height})` -> `/ai/knurl.md` | BOSL2 `knurled_cylinder()` | (use manifold-js knurl) |
| Dial in printer fit tolerances | `api.fasteners.clearanceCoupon({size:"M3"})` + `api.fasteners.clearance(fit)` -> `/ai/fasteners.md` | (build manually) | (use manifold-js fasteners) |
| Print-in-place mechanism (screw, spinner, hinge, captive ball, slider) | Separate parts via `labeledUnion`, separated by a ~0.3–0.5 mm clearance gap; assert `componentCount` -> `/ai/mechanisms.md` | (model parts + clearance manually) | (model parts + clearance manually) |
| Helical thread / auger / spiral flute | Real ISO threads: `api.threads.rod/bolt/nut(...)` -> `/ai/threads.md`. Custom augers/flutes: `cs.extrude(h, nDiv, 360*turns, scaleTop)` -> `/ai/mechanisms.md` | `linear_extrude(twist=)`, or BOSL2 `threaded_rod()` | (use manifold-js) |
| Organic figure / creature / body (figurine, character, person, animal, bust) | **`api.sdf` — capsule limbs + ellipsoid masses joined with `smoothUnion`, NOT a union of constant-radius primitives** -> `/ai/sdf.md` | (limited — use manifold-js) | (mesh-only; not in BREP) |
| Smooth fillet / blend between two shapes (no edge-picking) | `a.smoothUnion(b, k)` via `api.sdf` -> `/ai/sdf.md` | (not available) | (mesh-only; not in BREP) |
| Lattice / gyroid / periodic infill | `api.sdf.gyroid(cell, thickness)` -> `/ai/sdf.md` | (not available) | (mesh-only; not in BREP) |
| Twisted / bent body (one expression) | `api.sdf.<shape>(...).twist(deg)` -> `/ai/sdf.md` | (`linear_extrude(twist=)` for the extrusion case only) | (mesh-only; not in BREP) |
| Organic surface texture (rock / bark / coral / terrain) | `node.displace(amount, api.sdf.noise({...}))` via `api.sdf` -> `/ai/sdf.md` | (not available) | (mesh-only; not in BREP) |
| Fractal plant / coral / branching structure | `api.sdf.lsystem({ axiom, rules, iterations })` -> `/ai/sdf.md` | (not available) | (mesh-only; not in BREP) |
| Constant-thickness shell of any shape | `node.shell(t)` via `api.sdf` -> `/ai/sdf.md` | (not available) | (mesh-only; not in BREP) |
| Implicit surface / raw SDF function | `Manifold.levelSet(sdf, bounds, edgeLen)` | (not available) | (mesh-only; not in BREP) |
| Mesh-level smoothing (rounded blob from cube) | `.smoothOut(angle).refine(n)` | (not available) | (mesh-only; not in BREP) |
| Arbitrary vertex warp (bend extrusion) | `.warp(fn)` | (not available) | (mesh-only; not in BREP) |

**Rule of thumb:** if you find yourself writing a `for` loop to manually compute curve points, stop and check whether `Curves` (manifold-js) or BOSL2 (SCAD) already has the verb. AI-generated point-sampling math is brittle; the helpers are deterministic.

**Cross-engine recipe:** Inside a manifold-js session, mix BREP for the feature that needs exactness and Manifold for everything else:

```js
const { Manifold, BREP } = api;
const bracket = BREP.toManifold(
  BREP.box([40, 20, 8]).fillet(2),    // exact fillet — BREP-true
  Manifold
);
const hole = Manifold.cylinder(20, 3, 3).translate([0, 0, -5]);
return bracket.subtract(hole);
```

No language switch needed. See `/ai/replicad.md` for the full BREP API and when to switch to a dedicated BREP session for STEP export.

## Topic index (subdocs)

The main reference splits into focused subdocs. **Fetch each by calling `readDoc({name: "<short-name>"})`** — that's a tool call, not a URL the model can navigate to. Pull a subdoc on demand instead of loading everything up front.

| `readDoc` name | When to read it |
|---|---|
| `curves` | Before writing manifold-js code with `Curves.loft/sweep/bezier/arc/naca4/polyline/fillet/...` (smooth curves, organic shapes, airfoils, lofted surfaces). |
| `sdf` | Before reaching for `api.sdf.*` — smooth blends (`smoothUnion`), domain warps (`twist`/`bend`), lattices (`gyroid`), constant-thickness shells, noise displacement (`displace`/`noise` for rock/bark/coral texture), and L-system growth (`lsystem` for fractal plants/corals). **Also the default for any organic figure/creature/body** — figurines, characters, people, animals, busts: capsule limbs blended into ellipsoid masses with `smoothUnion`. Anything the prompt frames as "smooth", "blended", "twisted", "lattice", "gyroid", "organic/bumpy texture", "fractal/branching plant", or "figurine/character/creature/body/sculpt" lives here. |
| `bosl2` | Before writing SCAD code that needs edge rounding (`cuboid(rounding=)`), threads (`screw`), gears (`spur_gear`), path-following (`path_sweep`), or attachables. |
| `replicad` | Before using `api.BREP.*` inside a manifold-js session, or before switching to the replicad/BREP language. Covers exact fillets/chamfers, STEP export, and the manifold-js ↔ BREP boundary. |
| `voxel` | Before writing voxel-language code or importing an image as voxels. Covers the `api.voxels()` grid API, colors, coordinate system, and image import. |
| `mechanisms` | Before modeling a print-in-place / multi-part assembly that **moves** — a screw, spinner, hinge, captive ball, or slider. Covers clearance gaps, `componentCount` verification, twist-extrude threads/spirals, matched-taper nesting, and cutaway checks. |
| `print-safety` | Before exporting STL/3MF for FDM printing — minimum wall thickness, taper traps, sub-extrusion-width layer detection. |
| `printing` | The print-readiness toolkit — `checkPrintability` (overhangs, walls, bed fit, tip-over) and `get/setPrinterSettings`. The same check also runs automatically on STL / OBJ / 3MF / GLB export. Read before declaring a model print-ready, then steer the user to the dedicated Resize and Split tools if it doesn't fit. |
| `fasteners` | Before building parts that mate with real hardware — `api.fasteners.*` screw holes, tap/pilot holes, heat-set insert bosses, captive-nut pockets, the M2–M8 metric table, clearance presets, and a calibration coupon. |
| `joints` | Before connecting printed parts to each other — `api.joints.*` alignment pins, sliding dovetails, snap-fits, print-in-place barrel hinges, articulating ball joints (friction / clamp / snap retention), and annular snap rims for press-on lids. |
| `gears` | Before modeling an involute spur gear, a meshing gear pair, or a rack — `api.gears.spur/pair/rack(...)`, module/teeth/pressure-angle, centre distance, ratio, bores and hubs. |
| `threads` | Before modeling a threaded rod, bolt, or nut — `api.threads.rod/bolt/nut(...)`, the metric coarse-pitch table, fit clearance, and handedness. |
| `enclosure` | Before modeling a project box / case, a rounded shell, or PCB standoffs — `api.enclosure.box/shell/standoff(...)`, lip vs screw lids, mate clearance, and the `componentCount === 2` fit check. |
| `knurl` | Before adding a functional grip to a knob, thumbscrew, or handle — `api.knurl.diamond/straight/ribs(...)` knurled cylinders (distinct from decorative surface textures). |
| `colors` | Before any paint operation — the picker decision tree, labelled construction, vision-driven painting, export behavior. |
| `reference-images` | When the user attaches a photo or asks you to model from one — `setImages` shape, label conventions, the five-step photo-to-model loop. |
| `file-io` | Before exporting or importing programmatically — `*Data()` byte-returning methods, Recent Exports inbox, session payload shape. |
| `annotations` | When the user has marked up the model with the Annotate tool (or you need to write annotations programmatically). |
| `relief` | When making an image-derived part (keychain / tile / silhouette / stepped relief) via `importImageAsRelief`, or reading the single-nozzle swap guide (`getReliefSwapGuide`) / optical preview (`setReliefPreviewMode`). |
| `textures` | Before adding fuzzy-skin / fabric / knit surface detail — the `applySurfaceTexture(id, opts?, mode?)` tool or `api.surface.<id>({…})` in manifold-js code (ids: `fuzzy`, `knit`, `cable`, `waffle`, `fur`, `woven`, `knurl`, `voronoi`, `smooth`) — normal-displaced textures, their parameters, scoping a texture to one labelled region, and the paint-ordering rules. Also covers `applyVoronoiLamp` — a true perforated Voronoi shell (see-through lamp/planter; smooth-mesh output by default, optional voxel) — and `engraveModel`, which stamps text (or, from the UI, an image) onto the model as recessed channels, holes cut clean through (stencil), or an embossed raised relief (`raised: true`), with optional letter `color` for multicolor prints. |
| `iteration-workflow` | Before calling `runAndSave`, `forkVersion`, `modifyAndTest`, `createSessionWithVersions`, or managing session notes — the full versioning and iteration workflow. |
| `gotchas` | When something looks wrong — boolean overlap requirements, disconnected components, `paintRegion` on smooth surfaces, `probeRay` normals, `rotate` direction, re-running invalidating painted colors. |
| `visual-verification` | Before declaring a build done — all-faces check, edge overlay options, feature-specific checks, stat-based validation. |
| `spending` | To understand the user's compute budget and what each mode enforces or advises. |
| `manifold-api` | Quick reference for Manifold/CrossSection constructor and instance method signatures. |

## Common agent mistakes

- **Driving the UI with clicks/keystrokes** -- CodeMirror's auto-close-brackets will corrupt your code. Use `partwright.setCode()` and `partwright.run()` instead.
- **Forgetting `return`** -- code runs in `new Function()`, so a trailing expression is NOT automatically returned. You must write `return Manifold.cube(...)`.
- **Hand-rolling curve math instead of using helpers** -- if you need a smooth surface or curve, check the verb table above. `Curves.loft` / BOSL2 `skin()` are far more reliable than a hand-written polygon-sampling loop.
- **Building an organic figure as "primitive soup"** -- modeling a figurine, character, animal, or body by `union`-ing constant-radius spheres and capsules. It validates (manifold, prints) so nothing forces a rethink, but the ceiling is tubes-and-balls: every limb a cylinder, every joint a visible ball. For anything anatomical, reach for `api.sdf` `smoothUnion` (capsule limbs blended into ellipsoid masses) from the first version → `readDoc("sdf")`. "Smooth/organic figure" should trigger SDF the way "exact fillet" triggers BREP.
- **Not saving versions** -- a session is always open for you; save your work with `runAndSave` so the user can review it in the gallery.
- **Skipping visual verification** -- stats alone can't catch visual defects. After structural changes, call `renderViews()`; `renderViews({views: "box"})` is the only set that shows the back, left, and bottom faces.
- **Placing the front face on the wrong side** — "Front" in Partwright means the −Y face. The default Front view camera is at −Y looking toward +Y, so a door, a character's face, a screen, or any feature intended to face the viewer must have its outward normal pointing in the −Y direction. If `renderViews()` shows the back of your model in the "Front" tile, rotate the model 180° around Z (`model.rotate([0,0,180])`).
- **Flush boolean placement** -- shapes must overlap by at least 0.5 units to union correctly. Merely touching at a face produces disconnected components.
- **Tapering to a near-point on printed geometry** -- `scaleTop=[0.01, 0.01]` or chamfers that collapse the top to sub-millimeter area look fine in `geometry-data` but FDM slicers silently drop sub-extrusion-width layers, so the cap disappears on the print. See [/ai/print-safety.md](/ai/print-safety.md).
- **Not reading session context before modifying** -- when resuming work in an established session, call `getSessionContext()` first and read the notes/version history before making changes. See [Resuming a session](#resuming-a-session).
- **Branching off a prior version by hand** -- don't chain `loadVersion` -> `getCode` -> modify -> `runAndSave`. A silent failure (blocked return value, stale buffer) can drop parts of the parent. Use [`forkVersion({index} | {id}, transformFn, label, assertions?)`](#forking-a-prior-version) instead -- it loads the parent's code server-side, applies your transform, validates, and saves atomically.
- **Passing a bare index or id instead of `{index}` / `{id}`** -- `loadVersion` and `forkVersion` take an object with exactly one of `{index: number}` or `{id: string}`, e.g. `loadVersion({index: 2})` or `loadVersion({id: "Kx3Pq9mA2wEr"})`. Bare `loadVersion(2)` will return `{error: "...target must be { index: number } or { id: string }..."}`.
- **Passing the wrong object shape to `setImages`, `setReferenceGeometry`, `query`, `runAndAssert`, etc.** -- the API rejects unknown keys and wrong-type values. See [Argument validation](#argument-validation).
- **Doing `setCode` then `run` when you meant `runAndSave`.** `setCode` doesn't auto-run, `run` doesn't save and doesn't validate, and the gallery won't see the version. `runAndSave(code, label, assertions)` does all three atomically -- prefer it for committed iterations. See also [`runAndSave` is for committed iterations; `runIsolated` is for sanity checks](#runandsave-is-for-committed-iterations-runisolated-is-for-sanity-checks).
- **Passing a short stub to `runAndSave` intending to "save current state".** `runAndSave(code, ...)` is **authoritative**: it overwrites the editor with `code`, runs it, and saves the result. Passing anything other than the full intended code will replace the editor and save a broken version. To snapshot the editor as-is (e.g. after painting), call `saveVersion(label?)` instead — it captures the current code + geometry + colors without re-running.
- **Querying stale geometry after `setCode`.** `setCode` updates the editor but does NOT re-run. Calling `getGeometryData()` or `query()` after `setCode` (without a subsequent `runAndSave`/`run`) returns the geometry from the previous execution. The result now includes `stale: true` when the editor code hash doesn't match the last-run hash — treat this as a signal to run first.
- **No "fork from current editor" path.** `forkVersion({index}, ...)` forks a *saved* version. If your best code is unsaved in the editor, first call `await saveVersion("checkpoint")` to commit it as a version, then `forkVersion({index: <that index>}, ...)` from there. `listVersions()` shows the new index.

## Argument validation

Every `window.partwright` method validates its arguments at runtime. If you pass the wrong type or an object with unexpected keys, the call fails fast with a descriptive error rather than silently accepting bad input.

**Conventions:**

- **Methods that return a value** (e.g. `runAndSave`, `loadVersion`, `query`, `importSession`, `setReferenceGeometry`, notes/session CRUD) return `{ error: "..." }` on a validation failure. The error string names the exact parameter and expected type, e.g. `"setImages(images)[0].src must be a non-empty string, got "". See /ai.md#argument-validation"`.
- **Void setters** (`setCode`, `setClipZ`, `setImages`, `setView`, `setUnits`, `measureAt`, `measureBetween`, `probeRay`, `measurePoints`, `renameSession`) **throw** a `ValidationError`. Wrap calls in a try/catch if you want to handle failure rather than crash the console.
- **No coercion.** `setClipZ("5")` throws -- strings are not auto-converted to numbers. Pass the right type.
- **Unknown object keys are rejected.** `runAndAssert(code, { widthToDeep: [1,2] })` errors on the typo; it does not silently ignore it. Allowed keys are listed on each assertion/options interface.
- **Empty strings are rejected** by default for required string params (names, IDs, note text, code). Optional strings can be omitted but, if provided, must still be non-empty unless noted otherwise.

**Examples of what gets rejected:**

```js
partwright.navigateVersion('backward')            // ValidationError: direction must be one of: "prev" | "next"
partwright.setView('sketch')                      // ValidationError: tab must be one of: ...
partwright.measureAt([5])                         // ValidationError: measureAt(xy) must have exactly 2 elements
partwright.probeRay([0,0,0], [0, '1', 0])         // ValidationError: probeRay(direction)[1] must be a finite number
partwright.setImages([{ src: '' }])  // ValidationError: setImages(images)[0].src must be a non-empty string, got ""
partwright.setReferenceGeometry(code, { opacity: 2 })  // returns { success: false, error: "... .opacity must be <= 1 ..." }
await partwright.runAndAssert(code, { minVolume: '1000' })  // returns { passed: false, failures: ["... .minVolume must be a finite number ..."] }
await partwright.runAndSave(code, 'v1', { boundsRatio: { widthToDeep: [1,2] } })  // typo caught: not a recognized field
await partwright.query({ sliceAt: 5 })            // returns { error: "... .sliceAt must be an array ..." }
```

When you see a validation error, fix the call -- don't pattern-match around it.

## Console API -- window.partwright

<a id="console-api--windowmainifold"></a>

Call `partwright.help()` for a full method list, or `partwright.help('methodName')` for a specific method.

```js
partwright.run(code?)          // Run code, update views, return geometry stats
partwright.getGeometryData()   // Current stats (same as #geometry-data)
partwright.validate(code)      // Check code without rendering -> {valid, error?}
partwright.getCode()           // Read editor contents
partwright.setCode(code)       // Set editor contents (no auto-run)
partwright.getParams()         // Customizer schema + current values -> {schema, values}
await partwright.setParams({k:v}) // Tweak declared api.params knobs and re-run -> {geometry, params}
partwright.sliceAtZ(z)         // Cross-section -> {polygons, svg, boundingBox, area}
partwright.getBoundingBox()    // -> {min:[x,y,z], max:[x,y,z]}
partwright.getModule()         // Raw manifold-3d WASM module
partwright.getActiveLanguage() // -> 'manifold-js' | 'scad' | 'replicad' | 'voxel'
await partwright.setActiveLanguage(lang) // Swap engine ('manifold-js' | 'scad' | 'replicad' | 'voxel'); stashes the prev draft, restores the other
partwright.importImageAsVoxels(imageUrl, opts?) // Image (data:/URL) -> colored voxel session. See /ai/voxel.md
partwright.toggleClip(on?)     // Toggle 3D clipping plane -> {enabled, z, min, max}
partwright.setClipZ(z)         // Set clip height -> {enabled, z, min, max}
partwright.getClipState()      // -> {enabled, z, min, max}

// Viewport controls
partwright.setGridVisible(on?)       // Show/hide grid plane (omit to toggle) -> boolean
partwright.isGridVisible()           // Whether grid plane is visible
partwright.setStudioLighting(on?)    // Toggle studio lighting: reflections + soft shadow, on by default (omit to toggle) -> boolean
partwright.isStudioLighting()        // Whether studio lighting is on
partwright.setDimensionsVisible(on?) // Show/hide bounding box dimensions (omit to toggle) -> boolean
partwright.areDimensionsVisible()    // Whether dimensions overlay is visible
partwright.setOrbitLock(on?)         // Lock/unlock camera rotation (omit to toggle) -> boolean
partwright.isOrbitLocked()           // Whether camera orbit is locked
partwright.resetView()               // Reset camera to the default framing of the current model
partwright.setTheme('dark'|'light')  // Set color theme
partwright.getTheme()                // -> 'dark' or 'light'
partwright.setAutoRun(enabled)       // Enable/disable auto-render on code edit
partwright.isAutoRunEnabled()        // Whether auto-run is active

// Arrange mode (Tinkercad-style direct manipulation) -- see #arrange-mode
partwright.enterArrange()                 // Activate the click-to-select / drag-to-move tool -> {ok}
partwright.exitArrange()                  // Deactivate
partwright.isArrangeActive()              // -> boolean
partwright.selectParts(['box','ball'])    // Replace selection -> matched names
partwright.addToSelection(['cyl'])        // Extend (shift-click equivalent) -> matched names
partwright.clearSelection()
partwright.getSelection()                 // -> string[]
partwright.listArrangeParts()             // -> [{name, box:{min,max}, center}] every part the tool knows about
partwright.resizeSelection([2,1,1])       // Per-axis scale (or uniform [s,s,s]) -> {ok, reason?}
partwright.alignSelection('z','center')   // axis 'x'|'y'|'z', mode 'min'|'center'|'max' -> {ok, reason?}
partwright.groupSelection()               // ∪ Union the selected parts in code (not voxel) -> {ok, reason?}
partwright.subtractSelection()            // ∖ first - rest
partwright.intersectSelection()           // ∩
partwright.duplicateSelection()           // Clone, offset along +X -> {ok}
partwright.mirrorSelection('x')           // Mirror across axis
partwright.rotateSelection([0,0,90])      // Rotate in place (degrees, per-axis); 2+ pivots around group centroid (Z)
partwright.deleteSelection()              // Remove selected parts from the code
partwright.undo() / partwright.redo()     // Coarse-grained: one Tinkercad action = one step
partwright.canUndo() / partwright.canRedo()
partwright.setAutoCombine(false)          // Insert without auto-union (managed engines)
partwright.getAutoCombine()               // -> boolean
partwright.setSnapToGrid(true)            // Round drag/translate deltas to whole units (non-voxel)
partwright.getSnapToGrid()                // -> boolean
await partwright.exportGLB()   // Download GLB (browser file dialog -- prefer exportGLBData() in agent flows)
partwright.exportSTL()         // Download STL ("                                       exportSTLData() ")
partwright.exportOBJ()         // Download OBJ ("                                       exportOBJData() ")
partwright.export3MF()         // Download 3MF ("                                       export3MFData() ")
partwright.exportVOX()         // Download MagicaVoxel .vox (voxel sessions only -- keeps the editable grid). See /ai/voxel.md
// Agent-friendly variants -- bytes return inline, no file dialog. See /ai/file-io.md.
await partwright.exportGLBData()        // -> {filename, mimeType, base64, sizeBytes}
await partwright.exportSTLData()
await partwright.exportOBJData()        // text or base64 depending on whether colors are painted
await partwright.export3MFData()
await partwright.exportVOXData()        // -> {filename, mimeType, base64, sizeBytes} (voxel sessions only)
// Multi-part: bundle several Session Parts into one file (default: all parts). See /ai/file-io.md.
await partwright.export3MFParts(partIds?, filename?, {bambu?, printer?, nozzle?, filament?})  // 3MF: one part per Bambu/Orca plate (bambu:true, default; printer "p1s"/"h2c"…, nozzle "0.4", filament "pla"/"petg"…) or generic grid (false)
await partwright.exportOBJParts(partIds?, filename?)            // OBJ: named objects in one file, grid-arranged (+ .mtl .zip if painted)
await partwright.exportSTLParts(partIds?, filename?)            // STL: a .zip of one .stl per part
await partwright.exportGLBParts(partIds?, filename?)            // GLB: named nodes in one scene, grid-arranged
// ...each has a *Data twin (export{3MF,OBJ,STL,GLB}PartsData) that RETURNS the bytes instead of downloading.
await partwright.exportSessionData()    // -> {filename, mimeType, data, sizeBytes} (parsed JSON)
partwright.exportCodeData()             // -> {filename, mimeType, language, text, sizeBytes}
await partwright.importSessionData(parsedJson)         // -> {sessionId} or {error}
await partwright.importCodeData(code, language, name?) // -> {sessionId}
await partwright.importMeshData(base64, filename, {sessionName?}) // Import STL bytes (binary/ASCII; bare base64 or data: URL) as a new session -> {sessionId, isManifold, triangleCount, vertexCount} or {error}. isManifold:false = render-only (no booleans/paint/slicing).
partwright.listRecentExports()                         // Recent Exports inbox
await partwright.getRecentExport(id)
partwright.downloadRecentExport(id)
partwright.clearRecentExports()

// Isolated execution -- test code without changing editor/viewport state
await partwright.runIsolated(code, view?)  // -> {geometryData, thumbnail}. Default thumbnail is 4-iso composite; pass `view` ({elevation, azimuth, ortho, size}) for a single-angle preview.
await partwright.runAndAssert(code, assertions) // -> {passed, failures?, stats}
await partwright.runAndExplain(code)     // -> {stats, components[], hints[]} (debug disconnects)
await partwright.modifyAndTest(patchFn, assertions?) // Modify current code + test in isolation
partwright.query({sliceAt?, decompose?, boundingBox?}) // Multi-query current geometry in one call
partwright.renderView({elevation?, azimuth?, ortho?, size?, edges?})  // Render ONE angle -> data URL. edges: 'none'|'crease'|'wireframe' (default 'crease' uncolored / 'none' painted)
await partwright.renderViews({views?: 'auto'|'tri'|'all'|'box', angles?, size?, edges?})  // multi-angle labeled composite -> data URL; 'auto' (default) picks angles by aspect ratio; 'box' = all 6 faces (the all-faces final check); pass `angles` for a custom set; `edges` sets the overlay on every tile; prefer for verification
await partwright.setThumbnailCamera({azimuth, elevation} | 'current' | null)  // Pin the session's thumbnail/catalog-tile camera angle (degrees) instead of the default iso 3/4 view (default az 135°, el 35°). 'current' pins the angle you're looking at in the viewport (orbit, then pin — no guessing numbers); null clears. Persists on the session. -> {thumbCamera} or {error}
partwright.getThumbnailCamera()         // -> {azimuth, elevation} or null (unpinned ⇒ default iso)
partwright.sliceAtZVisual(z)            // Cross-section SVG at height z -> {svg, area, contours}
partwright.renderSection({axis?, offset?, size?})  // Slice on any axis -> {dataUrl, svg, axis, offset, area, contours}. axis: 'x'|'y'|'z' (default 'z'). offset defaults to bbox midpoint along axis. Engine-agnostic (works for SCAD too).
partwright.componentBounds()             // -> [{index, volume, triangleCount, bbox: {min,max,size,center}}], largest first. Use to find leaked / satellite pieces after a boolean.
partwright.pointInside([x,y,z])          // -> boolean (or null if no geometry). Tiny-probe-cube method; ambiguous within ~1e-5 of the surface.
partwright.healCurrent({tolerance?})     // -> {ok, volumeDelta, triangleDelta, componentCountBefore, componentCountAfter}. Runs .simplify() on the current model and applies the result. Engine-agnostic.
partwright.isRunning()                   // -> boolean (is code executing?)

// Spending mode (AI budget) -- respect what the user set; see #spending-mode
partwright.getSpendingMode()             // -> {mode, thinking, renderResolution, renderResolutionPx, verificationAngles, painting, sessionNotes, ...}
partwright.setSpendingMode('balanced')   // 'cheap' | 'balanced' | 'expensive' (sets thinking, vision, paint, notes, caps at once)

// Attachments -- durable session files: reference photos, models, docs, notes
//   (survive a chat clear; see /ai/reference-images.md#attachments)
partwright.setImages([{src, label?}, ...])  // replace image attachments; src is data URL or http(s) URL; label optional
partwright.addImage({src, label?})          // append one image; returns {id, src, label?}
partwright.removeImage(id)                  // remove by id; returns true if removed
partwright.clearImages()                    // clear image attachments (non-image ones kept)
partwright.getImages()                      // -> [{id, src, label?}, ...] (image-kind only)
partwright.addAttachment({src, kind?, mediaType?, label?, description?})  // pin ANY file; kind/mediaType inferred; description = why it matters
partwright.getAttachments()                 // -> [{id, kind, mediaType?, src, label?, description?, addedAt?, source?}, ...]
partwright.setAttachments([...]) / partwright.removeAttachment(id) / partwright.clearAttachments()

// Color regions (~30 paint methods) — call readDoc("colors") for the full picker decision tree.
partwright.paintRegion({point, normal, color, name?, tolerance?})  // coplanar flood-fill (flat faces)
partwright.paintNear({point, radius, color, name?})                // sphere selector (curved surfaces)
partwright.listRegions() / clearColors() / undoLastPaint() / redoLastPaint()

// Annotations — see readDoc("annotations")
partwright.listAnnotations() / addTextAnnotation({anchor, text}) / clearAnnotations()

// Sessions -- save/compare design iterations.
// NOTE: the in-app chat agent is scoped to the ONE session already open and
// has no session create/open/list tools — just use runAndSave. The
// create/open/list/clear console methods below are for the browser console and
// the external Claude Code agent only.
await partwright.createSession(name?)    // -> {id, url, galleryUrl}
await partwright.runAndSave(code, label?, assertions?) // Assert+save in one call -> {passed?, geometry, printability, version, diff, galleryUrl, colorRegions?}. `colorRegions` (also on saveVersion) lists each paint region's {name, kind, label?, triangleCount} — confirm `kind: 'byLabel'` for small files and a non-zero triangleCount. Voxel runs add `geometry.voxelCount`.
await partwright.createSessionWithVersions(name, [{code, label},...]) // Batch create
await partwright.buildCharacter(spec, {save?, label?}) // No-code humanoid: generate a posed, painted figure from a spec (body/pose/face/hair/clothing/colors) -> {code, ...runAndSave result}. Same engine as the 🧍 Character panel. Partial specs fall back to defaults. See /ai/figure.md.
await partwright.saveVersion(label?)     // Save current state as version
await partwright.saveAllParts()          // Save every part with unsaved changes (visits each, restores the active part) -> {saved, failed} or {error}
await partwright.listVersions()          // -> [{id, index, label, timestamp, status}]
await partwright.loadVersion({index} | {id})  // Load version into editor -> {id, index, label, code, geometryData, labelsAvailable, labelCount} or {error}
await partwright.renameVersion({index} | {id}, label) // Relabel a version (index is immutable) -> {ok, id, index, label} or {error}
await partwright.deleteVersion({index} | {id})  // Delete a version (refuses the last one; re-renders the replacement if the active one was deleted) -> {ok, deleted, newCurrent} or {error}
await partwright.diffVersions({index} | {id}, {index} | {id}) // Compare two versions -> {a, b, codeChanged, statDiff} (each side carries its code); the programmatic Diff tab
await partwright.forkVersion({index} | {id}, transformFn, label?, assertions?, carryColors=true) // Load + modify + validate + save atomically; carries parent colors -> {..., codeDiff, colors}
await partwright.copyColorsFromVersion({index} | {id}) // Re-apply a prior version's colors onto the current mesh -> {source, carried, dropped}
await partwright.getShareLink()          // -> {url, encodedBytes} read-only share link (or {error}); external/console agents hand this to the user — in-app users click the toolbar Share (↗) button instead
partwright.publish(platform?)            // Assisted publish to Printables/MakerWorld/Thingiverse/Thangs: no public upload API, so it prepares the file + cover + clipboard details and opens the upload page. platform?: 'printables'|'makerworld'|'thingiverse'|'thangs' (or {error}). See /ai/file-io.md
partwright.getGalleryUrl()               // -> URL for gallery view (local browser only)
partwright.getSessionUrl()               // -> URL for this session (local browser only)
await partwright.listSessions()          // -> [{id, name, updated}]
await partwright.openSession(id)         // Open existing session
await partwright.clearAllSessions()      // Delete all sessions & versions

// Parts -- multiple independent objects within one session. Each part has its
// own code + version history; the CURRENT part is what every other method
// (run, save, paint, export, listVersions, ...) acts on. Versions are scoped
// per part. Use parts for several distinct objects in one session (e.g. a box
// and its lid); save them as separate STLs/parts, or model each in isolation.
// Address a part by its name, its id, or its 0-based index (changePart/
// renamePart/deletePart all accept any of the three).
partwright.listParts()                   // -> [{id, name, order, isCurrent}]
partwright.getCurrentPart()              // -> {id, name, order} or null
await partwright.createPart(name?)       // New empty part + switch to it -> {id, name, order}
await partwright.changePart(name|id|index)   // Switch active part (loads its latest version)
await partwright.renamePart(name|id|index, newName)  // Rename a part
await partwright.deletePart(name|id|index)   // Delete a part + its versions (refuses the last one)

// Color regions -- tag face regions with a color. Full API in /ai/colors.md.
// Quick reference (~30 methods total):
partwright.probePixel({pixel, view})                                      // pixel-in-render -> {point, normal, distance, triangleId}
partwright.paintConnected({seed, maxDeviationDeg?, color, name?})         // BFS-flood by seed-normal deviation (organic meshes)
partwright.paintRegion({point, normal, color, name?, tolerance?})         // bucket: coplanar flood-fill (edge-bounded)
partwright.paintNearestRegion({point, color, searchRadius?, name?})       // snap-to-nearest variant
partwright.paintNear({point, radius, normalCone?, color, name?})          // sphere selector
partwright.paintStroke({points, radius, resolution?, maxEdge?, shape?, wrapAngleDeg?, color, name?}) // SMOOTH brush: subdivides mesh for a rounded painted edge (wrapAngleDeg = wrap tolerance, see note below)
partwright.paintInBox({box, normalCone?, color, name?})                   // AABB selector
partwright.paintInOrientedBox({box: {center, size, quaternion?}, color, smooth?, resolution?, maxEdge?})  // rotated box selector (same as UI Box tool); SMOOTH edges by default
partwright.paintFaces({triangleIds, color, name?})                        // explicit triangle ids
partwright.paintSlab({axis|normal, offset, thickness, color, name?, smooth?, resolution?, maxEdge?})  // planar range; SMOOTH edges by default
partwright.paintInCylinder({rMin, rMax, zMin, zMax, center?, axis?, normalCone?, color, name?, smooth?})  // cylindrical/annular shell (rMin=0 = solid); axis x|y|z (default z)
partwright.paintByLabel({label, color, name?})                            // by api.label() name (manifold-js) or top-level `label("name")` (SCAD)
partwright.paintByLabels([{label, color, name?}, ...])                    // batch sibling
partwright.paintComponent({index, color, name?, topOnly?})                // by listComponents() index
partwright.paintPreview({...selector, withImage?, view?})                 // dry-run
partwright.paintExplain({region, withImage?, view?})                      // diagnose committed region
partwright.assertPaint({region, expectedTriangleCount?, ...})             // verify
partwright.findFaces({box?, normal?, normalTolerance?, color?, ...})      // query by geometry/color
partwright.getMesh()                     // raw mesh access for procedural workflows
partwright.getMeshSummary({tolerance?, ...}?)                             // grouped coplanar faces
partwright.getFeatureCentroids({maxGroups?, withinBox?}?)                 // lightweight planning
partwright.listRegions() / listComponents() / listLabels()                // inventory
partwright.undoLastPaint() / redoLastPaint()                              // single-op undo
partwright.removeRegion(id) / setRegionVisibility(id, visible)            // per-region edits
partwright.hideRegion(id) / showRegion(id) / clearColors()
partwright.replaceColor({from:[r,g,b], to:[r,g,b], tolerance?})           // bulk-recolor matching regions (0..1 colors) -> {replaced}
await partwright.paintImage({imageUrl, view?:"front"|"back"|"left"|"right"|"top"|"bottom", label?, at?:[x,y,z], normal?:[nx,ny,nz], size?, rotationDeg?, detail?, removeBackground?, name?}) // project a raster image onto the surface as paint (logo/graphic/text/decal) -> {ok, name, triangles, avgColor}; use view (+ optional label) OR explicit at+normal (from probeRay); see /ai/colors.md
// Filament palette — the print slots (AMS/MMU) regions map onto; see /ai/colors.md
partwright.getPalette()                                                   // -> {id, name, capacity, constrained, slots:[{id,name,hex,td}]}
partwright.listPalettes() / setActivePalette(id) / createPalette(name)
partwright.addFilament({name, hex, td?}) / updateFilament(id, patch) / removeFilament(id)
partwright.setPaletteCapacity(n) / setPaletteConstrained(on)
partwright.getBucketTolerance() / setBucketTolerance(t)                   // UI bucket tool config
partwright.getBrushSize() / setBrushSize(r)                               // UI brush tool config
partwright.getBrushSmooth() / setBrushSmooth(on) / setBrushSmoothDivisor(2..1024) // UI smooth-brush config (detail = radius ÷ divisor)

// Notes -- track design context, decisions, and measurements
await partwright.addSessionNote(text)    // -> {id, text, timestamp}
await partwright.listSessionNotes()      // -> [{id, text, timestamp}, ...]
await partwright.updateSessionNote(noteId, text) // Edit a note
await partwright.deleteSessionNote(noteId)       // Remove a note

// Session context -- get everything in one call (for resuming sessions)
await partwright.getSessionContext()     // -> {session, versions[], notes[], currentVersion, versionCount, agentHints}
// agentHints includes `spending` -- the user's budget (see #spending-mode)
```

## Geometry data

**Preferred:** Use `partwright.getGeometryData()` to read current geometry stats programmatically.

**Fallback** (if `window.partwright` is not yet initialized): read `document.getElementById("geometry-data").textContent` -- it contains the same JSON.

```json
{
  "status": "ok",
  "vertexCount": 8, "triangleCount": 12,
  "boundingBox": { "x":[-5,5], "y":[-5,5], "z":[-5,5], "dimensions":[10,10,10] },
  "centroid": [0,0,0],
  "volume": 1000, "surfaceArea": 600,
  "minEdgeLength": 0.8, "meanEdgeLength": 2.1, "aspectRatio": 1.0,
  "genus": 0, "isManifold": true, "componentCount": 1,
  "crossSections": {
    "z25": {"z":-2.5,"area":100,"contours":1},
    "z50": {"z":0,"area":100,"contours":1},
    "z75": {"z":2.5,"area":100,"contours":1}
  },
  "executionTimeMs": 12,
  "codeHash": "a1b2c3d4"
}
```

Always present (cheap mesh-quality signals — read them *instead of* paying for a render when the question is structural, not visual):
- **`minEdgeLength` / `meanEdgeLength`** — shortest and mean triangle-edge length, in model units. A `minEdgeLength` under ~0.4 (≈ FDM extrusion width) means fine detail that will silently vanish on the print.
- **`aspectRatio`** — longest bounding-box dimension ÷ shortest non-zero one. A high value (>12) flags a tall/thin, tip-prone, fragile part. Omitted when not measurable (empty/degenerate).

Extra fields that appear conditionally:
- **`containedComponents: N`** — present when N components are fully enclosed inside another solid (e.g. sealed interior voids in a voxel shell). These are excluded from `maxComponents` assertion checks and from the floater warning, since they can't detach in print. Use `runAndExplain(code)` to inspect them individually.
- **`componentsInterpenetrate: true`** — present when two *separate* components' bounding boxes overlap: they interpenetrate rather than sit apart. If the model should be ONE solid, a boolean didn't fuse (operands must overlap by ≥ 0.5 units); if it's an intentional multi-part assembly, sanity-check the clearance gap.
- **`stale: true`** — present when the editor code has changed since the last execution (e.g. `setCode` was called without a subsequent run). Stats reflect the *previous* run. Call `runAndSave`/`run` before relying on component counts or other metrics.
- **`warnings: string[]`** — present when the geometry has issues worth acting on. Beyond the structural ones (non-manifold, free-floating components, empty paint regions) these now include the same cheap heuristics the headless `model:preview` emits: **over the ~500k triangle budget**, **extreme aspect ratio**, **sub-extrusion-width detail** (smallest edge < 0.4), and **interpenetrating components**. Treat every warning as a to-do before declaring done — they catch a whole class of defects from stats alone, no render needed.

On error: `{"status":"error","error":"...","executionTimeMs":2,"codeHash":"..."}`

`partwright.run()` and `partwright.getGeometryData()` also include a `printability` field — see [Printability](#printability).

### Common errors
- `Code must return a Manifold object` -- forgot `return` statement
- `function _Cylinder called with N arguments` -- wrong arg count
- Geometry looks wrong -- check `isManifold` and `componentCount` (failed booleans = extra components)
- `componentCount > 1` with `containedComponents` present -- the extra components are sealed interior voids, not true floaters. No fix needed for printing; use `runAndExplain` if you need to inspect them.

## Writing model code (manifold-js)

Code runs in a sandbox via `new Function('api', code)`. All transforms return new immutable Manifold instances -- chaining works.

```js
const { Manifold, CrossSection, Curves, setCircularSegments } = api;
// MUST return a Manifold object
```

**Sandbox environment:** The `api` object provides:
- `Manifold` and `CrossSection` -- the raw manifold-3d bindings
- `Curves` -- helpers for smooth/organic shapes (loft, sweep, bezier, arc, naca4, polyline with fillet, arbitrary-axis revolve, fillet/chamfer, pattern arrays). See **[/ai/curves.md](/ai/curves.md)**.
- `text(str, opts)` / `textSection(str, opts)` -- extruded or 2D text from Liberation Sans. See **[Text](#text--api-text--api-textsection)** below.
- `params` -- `api.params(schema)` is a **native manifold-js code feature** (it also works identically in voxel and replicad sessions): it declares the model's tweakable knobs and returns their resolved values for your code to read. The same knobs *also* surface as a live Customizer panel in the viewport, but the feature is the code call, not the panel — reach for it whenever a model should be reusable/parametric. See **[Customizer parameters](#customizer-parameters-apiparams)** below.
- `sdf` -- signed-distance-field builder for smooth blends, twists, gyroids, and shells. Tree-of-expressions style, lowered to a Manifold via `.build()`. See **[/ai/sdf.md](/ai/sdf.md)**.
- `geom` -- 2D sketch-primitive layer (dependency-free). Parametric profiles, each returning a `CrossSection` centered on the origin, ready for `.extrude(h)` / `Manifold.revolve(cs, …)` / booleans: `geom.star(r, points, innerRatio)`, `geom.ngon(r, sides)`, `geom.ellipse(rx, ry, segments)`, `geom.roundedRect(w, h, r, segments)`, `geom.chamferedRect(w, h, chamfer)`, `geom.slot(length, r, segments)`, `geom.teardrop(r, segments, angle)` (printable horizontal-hole profile), `geom.annulus(outer, inner, segments)`, `geom.sector(r, startDeg, endDeg, segments)`, `geom.fromPoints(pts)`, and subdivision smoothing `geom.smooth(pts, {iterations, kernel:'chaikin'|'cubic', closed})`. For polygon booleans/hull/offset use `CrossSection` directly; for smooth paths/sweeps/fillets use `Curves`; for gear profiles use `gears`. See `examples/geom_sketch.js`.
- `gears` -- involute spur gears, meshing gear pairs, and racks (`spur`/`pair`/`rack`), plus `centerDistance`/`ratio`/`dimensions` helpers. See **[/ai/gears.md](/ai/gears.md)**.
- `threads` -- ISO-metric threaded rods, bolts, and nuts (`rod`/`bolt`/`nut`) with a coarse-pitch table and print-fit clearance. See **[/ai/threads.md](/ai/threads.md)**.
- `fasteners` -- hardware fits: screw holes, tap holes, insert bosses, nut pockets, the M2–M8 metric table, clearance presets, calibration coupon. See **[/ai/fasteners.md](/ai/fasteners.md)**.
- `joints` -- part-to-part joinery: pins, dovetails, snap-fits, print-in-place hinges, ball joints, snap rims. See **[/ai/joints.md](/ai/joints.md)**. (`printFit` is a deprecated alias spreading both `fasteners` and `joints` — old sessions keep working; write new code against the split namespaces.)
- `enclosure` -- two-part project boxes (`box` → `{base, lid}`, lip or screw lid), rounded `shell`s, and PCB `standoff` posts; composes `fasteners` for the screw variant. A correct box reports `componentCount === 2`. See **[/ai/enclosure.md](/ai/enclosure.md)**.
- `knurl` -- functional grips: `diamond`/`straight`/`ribs` knurled cylinders for knobs, thumbscrews, and handles (distinct from decorative `surface` textures). See **[/ai/knurl.md](/ai/knurl.md)**.
- `setCircularSegments`, `setMinCircularAngle`, `setMinCircularEdgeLength` -- global curve resolution defaults.

Standard JavaScript globals (`Math`, `Array`, `Object`, `JSON`, `Date`, `console`, etc.) are available. There is no DOM access, no `fetch`/network, no `require`/`import`, and no file I/O. Do not attempt to load external libraries or make HTTP requests in model code.

### Customizer parameters (`api.params`)

`api.params` is part of the **manifold-js sandbox API** — a code feature, not a UI-only one — so adding parameters to a plain manifold-js model is just a matter of calling it; you do **not** need SCAD for parametric models. Declare the model's tweakable dimensions/options at the top via `api.params(schema)`. It returns an object of resolved values your code reads directly; a **Parameters panel** also appears in the viewport so the user (or you) can adjust them with sliders/toggles/dropdowns and the model re-runs live — Tinkercad-style customization without leaving code. This is the preferred way to make a model reusable: expose the few dimensions someone would actually want to change.

`api.params` works the same in **manifold-js, voxel, and BREP (replicad) sessions** — all three are JS sandboxes that share one implementation. For `number`/`int` params the panel pairs a slider with an editable number field, so you can type an exact value (and exceed the slider's range when the spec declares no `max`).

**SCAD sessions** use OpenSCAD's own customizer convention instead of `api.params` (SCAD isn't a JS sandbox): annotate top-level variables and they surface in the *same* Parameters panel. Overrides are applied through OpenSCAD's native `-D` flag — no code rewriting. `getParams`/`setParams` and persistence work identically.

```scad
// Outer width            (a preceding line-comment becomes the tooltip)
width = 30;     // [10:100]        slider 10..100
rows  = 2;      // [1:1:6]         slider 1..6 step 1
style = "flat"; // [flat, round]   dropdown of strings
mode  = 1;      // [0:Off, 1:On]   dropdown (value:label)
label = "PART"; // 12              text, max length 12
solid = true;                      // checkbox
cube([width, width, rows * 10]);
```

Only top-level literal assignments become knobs; variables inside modules/functions are ignored, and a `/* [Hidden] */` group suppresses its members. Vectors and expression-valued variables aren't customizable.

```js
const { Manifold } = api;
const p = api.params({
  width:   { type: 'number',  default: 30, min: 10, max: 120, step: 1, unit: 'mm' },
  rows:    { type: 'int',     default: 2,  min: 1,  max: 6 },
  rounded: { type: 'boolean', default: true, label: 'Rounded corners' },
  style:   { type: 'select',  default: 'flat', options: ['flat', 'beveled', 'round'] },
  title:   { type: 'text',    default: 'PARTS', maxLength: 12 },
  accent:  { type: 'color',   default: '#3b82f6' },
});
// use p.width, p.rows, p.rounded, p.style, p.title, p.accent ...
return Manifold.cube([p.width, p.width, p.rows * 10], true);
```

**Types:** `number` / `int` (slider; `min`,`max`,`step`,`unit`), `boolean` (toggle), `select` (dropdown; `options` = array of strings or `{value,label}`), `text` (`maxLength`), `color` (hex). Optional `label` and `help` on any. A malformed *schema* throws a clear `api.params: …` error; bad *values* are clamped or fall back to the default, never throwing — so the model always renders. Reading an undeclared key (`p.widht`) throws too, so a typo can't silently become `NaN`.

**Driving it yourself:** `partwright.getParams()` returns `{ schema, values }` so you can see what knobs exist; `partwright.setParams({ width: 50, rows: 3 })` changes values and re-runs (the `getParams`/`setParams` tools do the same). Prefer `setParams` over rewriting code when you only need to change a declared dimension — it's cheaper and keeps the model intact. The chosen values persist with each saved version (so a version re-renders exactly as saved). A `color` param's value (a hex string) drives geometry color by passing it to `api.label(shape, name, { color: p.accent })` (see [Model-declared color](#model-declared-color-self-coloring-models) below) — so a color knob recolors the model live. `text` params are captured but have no geometry sink yet.

### Model-declared color (self-coloring models)

Give a label a color right in the code and it renders **and exports** colored — no separate paint step, and the editor stays editable:

```js
const { Manifold } = api;
const body = api.label(Manifold.cube([20, 20, 20], true), 'body', { color: '#3b82f6' });
const knob = api.label(Manifold.cylinder(6, 4, 4, 32).translate([0, 0, 13]), 'knob', { color: [1, 0, 0] });
return body.add(knob);   // renders blue body + red knob; GLB/3MF carry the colors
```

The `color` is a hex string (`'#rrggbb'` / `'#rgb'`, the same form a `color` param produces) or an `[r,g,b]` array in 0..1. `api.labeledUnion([{ name, shape, color }, …])` takes the same per-entry `color`. Because the color travels with the labelled name, it **re-resolves every run** — so it survives Customizer parameter changes, and a `color` param wired in as `{ color: p.accent }` recolors the model live. For per-instance color (e.g. a parametric count), give each instance a distinct name: `api.label(petal, 'petal' + i, { color: … })`.

Model-declared colors are a derived **underlay**: manual paint (the paint tools / `paintByLabel`) composites on top as an optional override. They are **not** written into the saved paint sidecar — they come from the code, so re-running re-derives them. Inspect the active set with `partwright.getModelColors()` → `{ count, colors: [{ name, color, triangleCount }] }`; an empty `triangleCount` for a name means that label's triangles were consumed by a later boolean (check `listLabels().lostLabels`). See **[/ai/colors.md](/ai/colors.md)**.

#### Geometric paint in code — `api.paint.*`

Beyond labels, you can declare **geometric** paint right in the model code with `api.paint.*` — the in-code counterparts of the `paintInBox` / `paintSlab` / `paintInCylinder` / `paintByLabel` tools. Each call **records** a region (it doesn't mutate the mesh); after the run, Partwright resolves it against the fresh tessellation and renders it as part of the same model-color underlay as `api.label({color})`. Because the colors live in the code, there's no separate paint pass and **no paint sidecar** — re-running re-derives them, and they survive parameter changes. Later calls win on overlap.

```js
const { Manifold } = api;
const part = Manifold.cube([30, 30, 30], true).refine(16);   // refine so selectors have fine triangles
api.paint.slab({ axis: 'z', offset: 10, thickness: 10, color: '#e23b3b' });        // a flat band (axis or normal)
api.paint.box({ min: [-15, -15, -15], max: [0, 0, 0], color: [0.23, 0.51, 0.96] }); // axis-aligned box
api.paint.cylinder({ center: [0, 0], rMin: 0, rMax: 6, zMin: -15, zMax: 15, color: '#22c55e' }); // (annular) shell
api.paint.label('body', '#888');   // recolor an existing api.label(...) region
return part;
```

`color` accepts the same hex string or `[r,g,b]` (0..1) as `api.label`. These selectors resolve **by triangle**, so a coarse mesh paints whole facets — `refine(n)` (or higher segment counts) gives crisp edges, exactly like the paint tools. Arguments are validated strictly (unknown keys rejected, bad color/axis throw an actionable error). This is a manifold-js-only sandbox API; the standalone paint tools (`partwright.paint*`) remain for click/coordinate painting and run between code runs.

#### Surface textures in code — `api.surface.*`

Just like paint, **surface textures** can live in the code instead of being baked: `api.surface.fuzzy / .knit / .cable / .waffle / .fur / .woven / .knurl / .voronoi / .smooth` (or the generic `api.surface.apply('knit', {…})`). Each call records a texture op applied to the **final returned mesh**, in order — a parametric, non-baking counterpart of the `applyFuzzySkin` / `applyKnitTexture` / … tools (same options; size-relative defaults fill in omissions).

```js
const { Manifold } = api;
api.surface.knit({ stitchWidth: 1.2, amplitude: 0.6 });
return Manifold.sphere(10, 64);
```

Textures are expensive, so they're **memoized on the base mesh content**: any run that produces the same geometry (whitespace/comment/refactor edits included) renders the cached result instantly. **Every run applies the chain** — `partwright.run` / `runAndSave`, the Run button, version loads, and live typing alike — computing in a dedicated Worker behind an inline "Applying texture… Xs" status + Cancel, so the result you render/inspect is already textured with no extra step. Cancelling parks the chain behind a "⟳ Re-apply" pill (recover via the pill, `ensureSurfaceTexturesApplied()`, or any re-run). manifold-js-only. `partwright.applySurfaceTextureAsCode(id, opts?)` writes/updates the call in the code for you (insert before the final `return`, or edit the existing call), re-runs, and saves a version — the same path the Surface panel's "Apply as code" button takes. `partwright.applySurfaceTexture(id, opts?, mode?)` is the auto-routing wrapper: 'auto' (default) takes this in-code path on manifold-js and falls back to the bake tools elsewhere — returns `path: 'code' | 'bake'`. See [textures](/ai/textures.md#textures-as-code--apisurface-non-baking-in-a-manifold-js-session).

**Scope a texture to part of the model** with one extra option: `api.surface.knurl({ label: 'grip' })` textures only an `api.label(…)` region (so you can texture one shape of a union), and `api.surface.fuzzy({ region: { point: [x,y,z], radius } })` textures only the triangles near a world-space point. The label's color carries onto the textured region. (Scope keys are manifold-js-code only; ignored on the bake path.)

### Primitive origins and orientations

```
cube([x,y,z])         -> spans [0,0,0] to [x,y,z]. center=true -> centered at origin
sphere(r, n?)         -> centered at origin
cylinder(h,rLo,rHi?,n?) -> Z-axis, base z=0, top z=h. rHi=0 for cone
tetrahedron()          -> vertices at [1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]. Scale to size.
extrude(cs, h, nDiv?, twist?, scaleTop?, center?)
  -> along Z, z=0 to z=h. twist=degrees, scaleTop=number or [x,y] (0 for cone point)
revolve(cs, n?, degrees?)
  -> around Y axis, then remaps so result is Z-up.
    Profile X=radial distance, Y=height -> after revolve, Y becomes Z automatically.
    Only positive-X side used. degrees defaults to 360.
Segments: OMIT the segment argument so curves inherit the user's quality
  preset (recommended). Pass an explicit 6-8 only for an intentional
  low-poly look; only override upward when one specific feature needs more
  resolution than the preset. Never hard-code a low count (e.g. 32) just to
  "make it smooth" — that shadows the preset and looks chunky to the user.
```

**Default segment count:** Partwright seeds `setCircularSegments()` (and `$fn` for OpenSCAD) from the user's Modeling Quality preset (gear icon in the toolbar) before each run. Presets are Low (16) / Medium (32) / High (64) / Very High (128, the default) / Ultra (1024), plus a **Custom** option for an exact count (3–4096). So curves render smooth out of the box without any explicit configuration — and a user who wants ultra-smooth output picks **Ultra** (or a Custom value) once and it persists. **An explicit segments argument always overrides this preset for that primitive**, so leave it off unless you specifically want a different resolution than the user chose. The current preset is reported in the per-turn "Session toggle state" suffix; honor it. You can still call `setCircularSegments(n)` or pass an explicit count to override on a per-script or per-call basis when a design genuinely needs it.

### Constructors and instance methods

`readDoc({name: "manifold-api"})` for the full constructor list (Manifold, CrossSection, Curves, sdf, meshOps) and Manifold/CrossSection instance method signatures.

### Mesh-operations helpers (`api.meshOps`, also flat as `api.*`)

These are agent-leverage helpers: tasks you'd otherwise solve with mental trig (placement), boolean-fails-silently bugs (expectUnion), or "is this point inside?" introspection guesses.

**Predicates — return plain values, never mutate inputs.** Use them to validate your own work before declaring a build done.

```
api.intersects(a, b)             // true if a∩b has any volume (bbox fast-reject)
api.contains(outer, inner)       // true if inner ⊂ outer
api.pointInside(m, [x,y,z])      // true if point is inside the solid
api.bbox(m)                      // { min, max, size, center } — the missing accessor
api.componentBounds(m)           // [{ index, volume, triangleCount, bbox }], largest first
api.volumeDelta(a, b)            // b.volume() - a.volume()
```

**Alignment + patterns — return a Manifold, lazy/chainable.** These eat the mental-trig category of bug ("I rotated 60° times 6 but accidentally went CW"; "the lid should sit on the box top but I added the box height to the wrong axis").

```
api.alignTo(shape, target, {x?, y?, z?})
   // axes are 'min'|'max'|'center' (also left/right/top/bottom/front/back).
   // target: a Manifold | 'origin' | { min:[x,y,z], max:[x,y,z] } literal.

api.placeOn(shape, target, {at?, gap?})
   // shape's minZ → target's maxZ.
   // at: 'center' (default — match target's XY center)
   //     'preserve' — keep shape's own XY (skip re-centering)
   //     [x, y]    — match a specific point
   // gap: 0 leaves a touching seam (boolean treats as 2 pieces);
   //      negative (e.g. -0.5) overlaps volumetrically — what you usually want.

api.mirrorAcross(shape, plane)            // plane: 'x'|'y'|'z' or a normal vector
api.mirrorCopy(shape, plane)              // shape unioned with its mirror — symmetric parts
api.linearPattern(shape, count, step)     // step: number (X) or [x,y,z] vector

api.circularPattern(shape, count, {axis?, angle?, center?, radius?})
   // axis: 'z' default; angle: 360 default = full ring.
   // ENDPOINT CONVENTION:
   //   angle === ±360 → N copies at 360/N (no duplicate at seam).
   //   any other angle → endpoints INCLUSIVE: first copy at 0°, last at angle°
   //                     (step = angle/(count-1)).
   // radius: shortcut — pushes shape outward by `radius` BEFORE rotating
   //   (so you write `circularPattern(stud, 8, {radius: 25})` instead of
   //   pre-translating the stud yourself).

api.spiralPattern(shape, count, {anglePerCopy, risePerCopy, axis?, center?})
   // The "staircase / screw / spring" case — each copy gets both a rotation
   // AND an axial translation. Steps + helical fins + threaded rod profile
   // all fall under this one.
```

**Robust booleans + heal — catch silent failures.** `expectUnion` is the one to reach for when an agent has hit "I expected one piece, got three" — it tells you *immediately* instead of after the next render, and the error message includes a bbox/volume dump of each component so you can see which piece floated free.

```
api.expectUnion(parts, {expectComponents: 1})   // union + component-count check
api.expectDifference(a, b, {expectNonEmpty: true})
api.expectComponents(m, n)                      // standalone "is m exactly n pieces?" predicate
api.heal(m, {tolerance?})                       // .simplify() + status check, for STL imports / suspect booleans
```

Examples:

```js
const { Manifold } = api;
// Lid sitting on a box, centered, with 0.5mm gap so they don't fuse:
const box = Manifold.cube([40, 20, 10], true);
const lid = Manifold.cube([40, 20, 2], true);
return api.expectUnion([box, api.placeOn(lid, box, { gap: 0.5 })], { expectComponents: 2 });

// 6 legs around a table column, with a runtime check that they actually merged:
const column = Manifold.cylinder(20, 2, 2);
const leg = Manifold.cube([2, 6, 18], true).translate([0, 5, 9]); // pre-positioned
return api.expectUnion([column, api.circularPattern(leg, 6)], { expectComponents: 1 });

// Did the boolean carve too much? Did it carve anything?
const after = body.subtract(carveout);
if (api.volumeDelta(body, after) === 0) throw new Error("subtract did nothing");
```

For smooth curve helpers (`loft`, `sweep`, `naca4`, `bezier`, `polyline` with fillet, etc.), see **[/ai/curves.md](/ai/curves.md)**.

### Text — `api.text` / `api.textSection`

Produces 3D extruded text (or a 2D `CrossSection`) from the Liberation Sans font family. Uses the same TTF files as the OpenSCAD engine — ~1.6 MB, lazy-loaded on the first run that calls `api.text` or `api.textSection`.

```js
// 3D extruded text — returns a Manifold
const label = api.text("HELLO", {
  size:     10,          // character height in model units (default: 10)
  height:   2,           // extrusion depth along Z (default: 2)
  font:     'regular',   // 'regular' | 'bold' | 'italic' | 'bold-italic' (default: 'regular')
  spacing:  1.0,         // advance-width multiplier: >1 widens gaps, <1 compresses (default: 1.0)
  center:   false,       // if true, center the bounding box on the origin (default: false)
  segments: 8,           // bezier subdivision per curve segment (default: 8)
});
return Manifold.cube([40, 20, 5]).subtract(label.translate([2, 5, 3]));

// 2D cross-section — returns a CrossSection (for revolve, custom extrude, etc.)
const cs = api.textSection("AB", { size: 10, center: true });
return cs.extrude(5, 4, 45); // twisted extrusion
```

**Notes:**
- `size` is the font's em-size. Cap height ≈ 72% of `size` for Liberation Sans (so `size: 10` → caps ~7.2 units tall).
- The baseline sits at `y = 0`; ascenders extend above, descenders below.
- Holes in characters (inside of "O", "B", "P", etc.) are handled correctly via the even-odd fill rule.
- `api.text` and `api.textSection` are also available as `api.Curves.text` / `api.Curves.textSection`.

## Writing OpenSCAD code

When the engine is set to `scad`, code is compiled by OpenSCAD (WASM) instead of running as JavaScript.

**Key differences from manifold-js:**
- **No `return` statement** -- SCAD uses implicit top-level geometry. Just write `cube(10);`, not `return Manifold.cube(...)`.
- **SCAD syntax** -- standard OpenSCAD: `module`, `function`, `for`, `let`, `if/else`, `use`, `include`.
- **Built-in primitives** -- `cube`, `sphere`, `cylinder`, `polyhedron`, `polygon`, `circle`, `square`, `text`.
- **Transforms** -- `translate`, `rotate`, `scale`, `mirror`, `multmatrix`, `color`, `resize`.
- **Booleans** -- `union()`, `difference()`, `intersection()`, `hull()`, `minkowski()`.
- **Extrusion** -- `linear_extrude(height, twist, slices, scale)`, `rotate_extrude(angle)`.
- **2D rounding** -- `offset(r=...)` for rounded outlines; `minkowski() { shape; circle(r); }` for rounded interiors.
- **Curve resolution** -- `$fn=N` for explicit segments, or `$fa`/`$fs` for angle/length-based segmentation.
- **The `--enable=manifold` flag is set automatically** -- OpenSCAD uses the same manifold-3d boolean backend, so CSG results match the JS engine.

**BOSL2 library is bundled** -- start your file with `include <BOSL2/std.scad>` to unlock rounded cuboids, skin/loft, sweep, threaded rods, gears, attachables, and pattern distributors. See **[/ai/bosl2.md](/ai/bosl2.md)**. First BOSL2 run on a fresh page fetches ~4 MB of library source (one-time, then cached).

**Known limitations:**
- `text()` uses Liberation Sans (Regular/Bold/Italic/BoldItalic) — same font set as `api.text()` in manifold-js. Font files (~1.6 MB) are lazy-loaded on the first run that uses `text()`. Other font names will silently produce no geometry.
- External `.scad` libraries (other than the bundled BOSL2) can't be `include`d -- there's no filesystem to read from.
- Each SCAD run creates a fresh WASM instance (~100-300ms overhead). For fast iteration, manifold-js is snappier.

**Example SCAD code (stock):**
```scad
// Cube with cylindrical hole
difference() {
  cube([10, 10, 10], center=true);
  cylinder(h=12, r=4, center=true, $fn=32);
}
```

**Example SCAD code (BOSL2):**
```scad
include <BOSL2/std.scad>
cuboid([40, 30, 20], rounding=3);     // all edges filleted
```

### Mesh-operations equivalents in SCAD

The `api.*` mesh-ops helpers (intersects, placeOn, circularPattern, expectUnion…) are sandbox helpers exclusive to manifold-js. SCAD has native equivalents — most of them in BOSL2:

| `api.*` helper (manifold-js) | SCAD / BOSL2 equivalent |
|---|---|
| `api.placeOn(a, b)` (place A on top of B) | BOSL2 `attach(TOP, BOTTOM)` on attachable parents (`cuboid(... ){ attach(...) cuboid(...); }`) |
| `api.alignTo(a, b, {...})` | BOSL2 `position(<anchor>)` + `anchor=<anchor>` on attachable shapes |
| `api.linearPattern(s, n, step)` | BOSL2 `xcopies(spacing, n=)`, `ycopies(...)`, `zcopies(...)` |
| `api.circularPattern(s, n)` | BOSL2 `ring_copies(n=N, r=R)` (or `rot_copies(rots=[...])`) |
| `api.mirrorCopy(s, plane)` | BOSL2 `mirror_copy([nx,ny,nz])` |
| `api.expectUnion(parts, {expectComponents})` | No language-level equivalent — read `componentCount` off `getGeometryData()` after running and assert in JS test harness |

The **introspection helpers** (cross-section image, per-piece bbox, point-in-solid, healing) work the same regardless of engine — they're on `window.partwright`:

```js
partwright.renderSection({ axis: 'z', offset: 5 })   // SVG data URL of the slice
partwright.componentBounds()                          // per-piece bbox/volume for the current model
partwright.pointInside([0, 0, 5])                     // true / false
partwright.healCurrent()                              // simplify + rebuild current geometry
```

These are engine-agnostic — call them after a SCAD render to debug cavities, find leaked components, or clean up a problematic boolean result.

## Common pitfalls & gotchas

`readDoc({name: "gotchas"})` — boolean overlap requirements, disconnected components, `paintRegion` bimodal on smooth surfaces, trusting `probeRay` normals, `rotate` direction convention, re-running invalidating painted colors, and `runAndSave` vs `runIsolated`.

## Printability

Every `runAndSave`, `run`, and `getGeometryData` response now includes:

```json
"printability": { "printable": true, "issues": [] }
```

`printable` is `false` when either condition holds:
- `isManifold: false` — mesh has gaps or non-manifold edges (not watertight, slicer will reject or produce holes)
- `componentCount > 1` — model has disconnected solids; floaters print as separate pieces or fail support generation

**Always check `printability.printable` after `runAndSave`.** If it is `false`:
1. Read `printability.issues` for the specific problems.
2. For disconnected components, call `runAndExplain(code)` to see which pieces are floating and get overlap suggestions.
3. Fix the geometry and re-save. Do not leave a saved version with `printable: false` as the final result of a build task — the user intends to print it.

Voxel models are especially prone to `componentCount > 1` because every isolated island of voxels becomes its own component. After building a voxel scene, always verify `printability.printable`. If components > 1, either bridge the floating islands with connecting voxels, or confirm with the user that the separate pieces are intentional.

```js
const r = await partwright.runAndSave(code, 'v1');
if (!r.printability.printable) {
  // r.printability.issues: e.g. ["3 disconnected components"]
  // fix the code, then re-save
}
```

## Print-safe geometry

For 3D-printable output (FDM/FFF), features thinner than the nozzle's extrusion width are silently dropped by the slicer even though `geometry-data` (volume, `componentCount`, `genus`, `isManifold`) looks correct. The classic trap is `scaleTop` near zero tapering to sub-extrusion-width layers near `zMax`.

Before exporting anything intended for printing, **call `readDoc({name: "print-safety"})`** for the rules of thumb, the dense-sample slice check, and the worked failure mode.

## Color regions

Color regions tag a coplanar set of triangles with an RGB color. Regions are persisted on the saved version, ride through GLB and 3MF exports (vertex colors / `<basematerials>` `pid` attributes), and show as swatch badges in the gallery. They do **not** modify the geometry. STL and OBJ exports drop them — formats don't carry color.

The paint helpers are exposed both as tool calls (`paintRegion`, `paintFaces`, `paintNear`, `paintStroke`, `paintInBox`, `paintSlab`, `paintNearestRegion`, `paintComponent`, `paintByLabel`, `paintByLabels`, `paintConnected`, `paintPreview`, `paintExplain`, `findFaces`, `probePixel`, `probeRay`, `getMeshSummary`, `listComponents`, `listLabels`, `undoLastPaint`, `redoLastPaint`, `removeRegion`, `clearColors`) and on `window.partwright`.

Before painting anything substantial, **call `readDoc({name: "colors"})`** for the picker decision tree (which `paint*` for which intent), the labelled-construction workflow, vision-driven painting with `probePixel`/`paintConnected`, undo/redo, and export behavior.

## AI-friendly file I/O

The standard `exportGLB()` / `exportSTL()` / `exportOBJ()` / `export3MF()` methods trigger a browser download — an AI agent can't observe what landed in the user's Downloads folder. Use the `*Data()` siblings (`exportGLBData()`, `exportSTLData()`, …) to get the bytes back as base64 over the API instead, and `importSessionData()` to import a session payload without touching the OS file picker.

**Call `readDoc({name: "file-io"})`** before exporting or importing programmatically — covers the Recent Exports inbox, the full method list, and the import payload shape.

## Reference images & photo-to-model

The user can attach reference photos via `partwright.setImages([...])`; they appear in the Attachments tab and Gallery. Photos are one **kind** of session attachment — the same panel also holds reference models, PDFs, and notes (`getAttachments`/`addAttachment`), all of which persist across a chat clear. There's also an analyze-and-build workflow that takes a single photo and bootstraps a model from it.

**Call `readDoc({name: "reference-images"})`** when the user attaches a photo or asks you to model something from an image — covers `setImages`/`getAttachments` arguments, label conventions for elevation matching, the durable-attachments model, and the five-step photo-to-model loop (major masses first, verify each elevation, iterate details).

## Iteration workflow

`readDoc({name: "iteration-workflow"})` — `runAndSave`, `runIsolated`, `runAndAssert`, `modifyAndTest`, `forkVersion`, `createSessionWithVersions`, `copyColorsFromVersion`, session notes (with prefix conventions), resuming a session with `getSessionContext()`, and the recommended step-by-step pattern.

### Assert + save in one call

`runAndSave` accepts optional assertions. If provided, validates in isolation first -- fails fast
without saving if assertions don't pass. On success, saves the version and returns stat diff:
```js
const r = await partwright.runAndSave(code, "v2 - added towers", {
  isManifold: true, maxComponents: 1
});
// If assertions fail: r.passed = false, r.failures = [...], version NOT saved
// If assertions pass (or no assertions given):
// r.passed         = true (only present when assertions provided)
// r.geometry       = full geometry stats
// r.printability   = { printable: true/false, issues: [] }   ← check this always
// r.version        = { id, index, label }
// r.diff           = { volume: { from, to, delta }, componentCount: ..., ... }
// r.galleryUrl     = gallery URL for human review
```

### Forking a prior version

When iterating on a design, the common flow is *load a previous version, tweak it, save as a new version*.
Doing that across separate `loadVersion` -> `getCode` -> modify -> `runAndSave` calls is fragile: if any
step fails silently (wrong arg type, a client-side content filter on `getCode`, etc.) you can end up saving
a regression without noticing. `forkVersion` collapses the whole chain into one server-side call:

```js
const r = await partwright.forkVersion(
  { index: 11 },                       // or { id: "Kx3Pq9mA2wEr" } from listVersions()
  code => code.replace('towerH = 28', 'towerH = 35'),
  "v11a - taller towers",              // label for the new version
  { isManifold: true, maxComponents: 1 }, // optional assertions (validated before saving)
  true                                  // carryColors (default true) — re-apply parent colors
);
// On success:
//   r.passed       = true (only when assertions provided)
//   r.parent       = { id, index, label } of the version you forked from
//   r.geometry     = full geometry stats
//   r.version      = { id, index, label } of the newly saved version
//   r.diff         = stat diff vs. the previous current version
//   r.codeDiff     = { changed, added, removed, diff } — what actually changed in the SOURCE.
//                    Verify your transform landed here: changed:false means the code is
//                    byte-identical to the parent (your edit was a no-op).
//   r.colors       = { carried: [names], dropped: [names] } when the parent had colors
//   r.galleryUrl   = gallery URL for human review
// On failure:
//   r.error        = "No version found with index ..." / "transformFn threw: ..." / etc.
//   r.passed=false + r.failures=[...] if assertions didn't pass (nothing saved)
```

`target` is an object with exactly one of `{ index }` (numeric, 1-based) or `{ id }` (string from
`listVersions()[].id`). The two are never mixed, so there's no ambiguity about which field is being
looked up. This is the recommended way to build parallel branches (v11a, v11b, ...) off a shared
parent without a load/read/modify/save round-trip chain.

**Color carry-over.** If the parent version has color regions, `forkVersion` re-applies them to the
forked geometry automatically — each region's geometry-relative descriptor (box / slab / `byLabel` /
coplanar / connected-from-seed) is re-resolved against the new mesh, so a dimension tweak does **not**
force you to repaint. Regions whose descriptor no longer matches (a label the new code dropped, raw
triangle ids on changed topology) are skipped and reported in `r.colors.dropped`. Pass `carryColors:
false` for an intentionally uncolored fork.

> When the AI tool form is used, pass `patches: [{find, replace}, ...]` instead of a `transformFn`.
> Each `find` must occur **exactly once** in the parent code — a find that matches zero or multiple
> times is rejected with an error rather than silently saving the parent unchanged, so copy the exact
> text (whitespace included) from `getCode()`/`loadVersion()`.

### Copying colors onto a rebuilt version

When you rebuild geometry from scratch with `runAndSave` (rather than forking) but it matches an
earlier *painted* version, transfer the colors in one call instead of repainting region by region:

```js
const r = await partwright.copyColorsFromVersion({ index: 7 }); // the painted version
// r.source  = { index, label }
// r.carried = [names] re-resolved onto the current mesh
// r.dropped = [names] whose descriptor no longer matches — repaint those
```

This is in-memory like any paint op — your next `runAndSave` serializes the current regions, so they
persist with it. (You don't need this after `forkVersion`, which already carries colors.)

### Modify and test

Modify current editor code with a transform function and test the result without committing:
```js
const r = await partwright.modifyAndTest(
  code => code.replace('towerH = 28', 'towerH = 35'),
  { isManifold: true, maxComponents: 1 }
);
// r.modifiedCode = the transformed code string
// r.codeDiff     = { changed, added, removed, diff } — confirm the tweak landed.
//                  changed:false means your transform matched nothing (a no-op);
//                  the stats below would then describe the UNCHANGED code.
// r.stats        = geometry stats of the modified code
// r.passed       = true/false (only if assertions given)
// r.failures     = [...] (only if failed)
```

> Prefer the AI tool's `find`/`replace` (or `patches`) form over a bare `code => code.replace(...)`
> transform: a string `replace` whose needle is absent returns the code **unchanged with no error**,
> so the tweak silently no-ops. The `find`/`replace` form is rejected when the needle doesn't match
> exactly once. Either way, check `codeDiff.changed` before trusting the result.

### Multi-query current geometry

Query multiple properties of the already-computed geometry in a single call:
```js
const r = partwright.query({
  sliceAt: [5, 10, 15, 20],  // cross-sections at these Z heights
  decompose: true,             // component breakdown
  boundingBox: true,           // bounding box
});
// r.slices     = { z5: {area, contours, ...}, z10: {...}, ... }
// r.components = [{ index, volume, centroid, boundingBox }, ...]
// r.boundingBox = { min: [...], max: [...] }
// r.stats      = current geometry-data stats
```

### Batch session creation

Create a complete session with multiple versions in one call:
```js
const r = await partwright.createSessionWithVersions("Castle", [
  { code: v1Code, label: "v1 - walls" },
  { code: v2Code, label: "v2 - towers" },
  { code: v3Code, label: "v3 - gate" },
]);
// r.session = {id, name}
// r.versions = [{version, geometry}, ...]
// r.galleryUrl = "/editor?session=abc&gallery"
```

### Session notes -- tracking design context

Use session notes to build a persistent record of the design story. This enables any agent (or human) resuming the session later to understand what happened and why.

**When to log notes:**
- Before first version: log the user's requirements and constraints
- On each version: include rationale in the label and optional `notes` field
- When the user gives feedback: log it as a note, then save the next version
- On key decisions: log dimensions, materials, constraints, tradeoffs
- On failed attempts: log what didn't work and why

**Prefix conventions** (so notes are scannable):
```js
await partwright.addSessionNote("[REQUIREMENT] 5.5x5.5x36in boards, snap-on C-channel, screw holes");
await partwright.addSessionNote("[FEEDBACK] User: groove looks too shallow, wants full tongue insertion");
await partwright.addSessionNote("[DECISION] Omitted right wall on end pieces for clearance");
await partwright.addSessionNote("[MEASUREMENT] Tongue width = outerW - 2*wallT = 133.7mm");
await partwright.addSessionNote("[ATTEMPT] v2 tried 3mm walls but too flimsy. Increased to 5mm in v3");
await partwright.addSessionNote("[TODO] Add chamfer to bottom edge for easier print removal");
```

Version-level notes go in the `runAndSave` assertions object:
```js
await partwright.runAndSave(code, "v2 - widened tongue per feedback", {
  isManifold: true,
  notes: "Changed tabW from 20mm to outerW - 2*wallT per user request"
});
```

### Resuming a session

When opening a session you haven't worked on (or returning after time away), **always call `getSessionContext()` first**:
```js
await partwright.openSession(sessionId);
const ctx = await partwright.getSessionContext();
// ctx.session    -- {id, name, created, updated}
// ctx.versions   -- [{index, label, timestamp, notes?, geometrySummary: {volume, boundingBox, ...}}]
// ctx.notes      -- [{id, text, timestamp}]  (all session notes)
// ctx.currentVersion -- {index, label}
// ctx.versionCount
// ctx.agentHints -- {apiDocsUrl, recommendedEntrypoint, codeMustReturnManifold, recentErrors, spending}
//   recentErrors: last 5 validation errors from this page session (helps avoid repeating mistakes)
```

Read the notes and version history before making changes. The notes tell you:
- What the user originally asked for (`[REQUIREMENT]` notes)
- What was tried and why (`[DECISION]` and `[ATTEMPT]` notes)
- What feedback the user gave (`[FEEDBACK]` notes)
- What measurements or constraints matter (`[MEASUREMENT]` notes)
- What still needs to be done (`[TODO]` notes)

### Recommended iteration pattern

1. Write initial code, assert+save in one call: `runAndSave(code, "v1 - base", {isManifold: true, maxComponents: 1})`

## Visual verification

**Stats alone cannot catch visual defects.** Always call `renderViews({views: "box"})` before declaring done — it shows all six orthographic faces including back, left, and bottom where mistakes hide.

`readDoc({name: "visual-verification"})` — render tiers, edge overlay (`edges: 'crease'|'none'|'wireframe'`), feature-specific checks, and stat-based validation.

## Spending mode

Read `partwright.getSpendingMode()` at session start and honor the user's budget (`cheap`/`balanced`/`expensive`/`custom`). Also in `getSessionContext().agentHints.spending`.

`readDoc({name: "spending"})` for what each mode enforces (painting toggle, render resolution, session notes) and what you should adjust (thinking level, image verification frequency, pacing).

## Annotations

Users can mark up the model surface with the **Annotate** tool (✏️ in the viewport overlay): freehand strokes raycast onto the mesh, and text labels pinned to a 3D anchor. Annotations are per-version, persist in session exports, and are distinct from color regions — they do not modify geometry.

**Call `readDoc({name: "annotations"})`** when the user has placed annotations and you want to read them, or when you need to write annotations programmatically — covers the `getAnnotations` / `setAnnotations` shape and the persistence model.

## Arrange mode

<a id="arrange-mode"></a>

Arrange mode is the Tinkercad-style direct-manipulation tool reached from the Insert palette: a persistent viewport mode where clicking a shape selects it, shift-click extends the selection, drag slides parts around, and a shift-drag marquee lassos every part whose centre lands inside it. The same selection drives **Size** (per-axis scale), **Align** (min/center/max along X/Y/Z), and the **Operations** row (Group / Subtract / Intersect / Duplicate / Mirror / Delete). Every action is recorded in a coarse-grained **undo** stack — one Tinkercad-style gesture = one Ctrl-Z step — independent of CodeMirror's per-text-edit history.

The tool also seeds itself from the live code when you enter it: any hand-written declaration the parser recognises (e.g. `const myCube = Manifold.cube([10,10,10]).translate([5,0,0])`, `cube([10,10,10]) // part: foo`, `v.fillBox([0,0,0],[10,10,10],'#abc') // part: ball`) becomes draggable / resizable / alignable — not just parts you inserted from the palette.

Every UI action is exposed on `window.partwright` so you can drive the same flow from code:

```js
partwright.enterArrange();
partwright.selectParts(['ball', 'box']);   // Replace selection
partwright.alignSelection('z', 'min');     // Drop them to the same Z floor
partwright.resizeSelection([2, 2, 1]);     // 2x2x1 anisotropic scale
partwright.groupSelection();               // ∪ Union them in code
partwright.undo();                         // Reverse one step
partwright.listArrangeParts();             // [{name, box:{min,max}, center}, …]
partwright.exitArrange();
```

A successful action returns `{ ok: true }`; rejected ones return `{ ok: false, reason: <why> }` (e.g. `'no selection'`, `'need 2+ parts'`, `'voxel grids union implicitly'`). The selection set, registry, and undo stack are the **same** instances the panel buttons use — alternating UI clicks and `partwright.*` calls is supported.

**`enterArrange()` opens the Insert panel as a side effect** so the chip strip, Size/Align inputs, and Undo/Redo buttons are visible — matching what a user sees when they enable arrange by hand. Headless flows that just want the canvas pointer hook should still call it; the panel doesn't steal focus from `partwright.*` calls.

**Drag along Z.** Hold **Alt** during drag to slide the part along the world Z axis instead of across the horizontal plane (Tinkercad's lift-up gesture). The drag plane is built from the camera's look direction so the part stays under the cursor as the camera turns.

**Group centroid.** When 2+ parts are selected, `resizeSelection` scales around — and `rotateSelection` (Z axis) pivots around — the **union centroid** rather than each part's own centre. This matches Tinkercad's behaviour: a group resize spreads the parts apart and a Z-rotation swings them around the common pivot.

**Snap-to-grid.** `setSnapToGrid(true)` rounds every per-engine translate delta (drag commit, align spread, rotate spread) to whole units. Voxel grids already snap; this gives the JS/SCAD/BREP engines an opt-in tidy-lattice mode. Note: with snap on, each part in a group transform rounds independently, so a fractional group-spread (e.g. a 2.5× scale) can drift the layout by up to one unit per part.

**Caveats.** Hand-written parts the regex parser can't decode (chained `.scale()`/`.color()`/computed args/custom expressions) stay out of the registry and are skipped silently — a single trailing `.translate(...)` and a single trailing `.rotate(...)` are recognised. Voxel rotation is rejected (lattice quantization makes arbitrary angles unfaithful). Voxel grids union implicitly, so `groupSelection` / `subtractSelection` / `intersectSelection` are no-ops in a voxel session.



