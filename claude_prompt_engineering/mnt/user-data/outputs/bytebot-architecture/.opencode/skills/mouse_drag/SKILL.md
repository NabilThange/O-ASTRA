# mouse_drag

## Purpose
A single-call drag from one point to another. Covers window resizing/moving,
drag-and-drop of files or list items, and simple sliders that don't need intermediate
motion steps.

## Parameters & Bounds
| Param | Type | Valid range | Default |
|---|---|---|---|
| `startX` | int | 0–1280 | required |
| `startY` | int | 0–960 | required |
| `destX` | int | 0–1280 | required |
| `destY` | int | 0–960 | required |

## When To Use
- Moving or resizing a window by its title bar or edge/corner handle.
- Dragging a file from one folder view to another, or an item within a reorderable
  list.
- A slider or scrollbar where a single direct jump to the target position is enough.

## When To Avoid
- If the target UI only registers drags that pass through several intermediate points
  (some canvas/slider widgets ignore a single large jump), use `mouse_down` +
  `move_cursor` (repeated) + `mouse_up` instead — see the `mouse_down_up` skill.
- Don't use this for anything that isn't actually a drag interaction — a single click
  destination reachable directly doesn't need this tool.

## Canonical Examples
- **Good:** Window title bar at (400, 20), want to move window to top-left →
  `mouse_drag(startX=400, startY=20, destX=150, destY=20)` → Predict: window relocates,
  title bar now near x=150.
- **Good:** File icon at (200, 300) dragged into a folder icon at (600, 300) →
  `mouse_drag(startX=200, startY=300, destX=600, destY=300)` → Predict: file disappears
  from origin view or folder shows updated item count.
- **Wrong:** Using this for a canvas-drawing app where the line/shape only renders if
  the drag passes through intermediate points — a straight-line jump can produce no
  visible stroke at all, since the app never sees the "in-between."

## Common Pitfalls
- Fast single-call drags can be too fast for some drop targets to register — if Verify
  shows the item snapped back to its origin, that's a sign to decompose into
  `mouse_down`/`move_cursor`/`mouse_up` instead of just retrying the same drag.
- `startX/startY` must land exactly on the draggable handle (window title bar, specific
  icon, slider thumb) — a start point just outside it will drag nothing, or worse, drag
  whatever else happens to be under that pixel.
- Destination coordinates should account for where the drop target's *drop zone*
  actually is, which is sometimes larger than the visible icon — but don't assume this
  without checking the app's behavior once first.

## Post-Action Verification
Screenshot and confirm the dragged element (window, file, slider handle) is actually at
the destination — not still at the origin (a "snap back," meaning the drag wasn't
registered) and not somewhere else entirely (meaning the destination coordinate was
off).
