# move_cursor

## Purpose
Moves the mouse to a coordinate without clicking. Used to trigger hover states
(tooltips, dropdown reveals, hover-highlighted menu items) and to pre-position before a
drag sequence.

## Parameters & Bounds
| Param | Type | Valid range | Default |
|---|---|---|---|
| `x` | int | 0–1280 | required |
| `y` | int | 0–960 | required |

## When To Use
- Revealing a tooltip or hover-only menu before you can see the actual click target.
- Positioning the cursor at a drag's start point before issuing `mouse_down`.
- Confirming a hover-highlight effect exists on an element (helps verify you've found
  the right target before committing to a click).

## When To Avoid
- Never use this expecting it to activate anything — it has no click. If the goal is to
  press something, follow it with `mouse_click`, don't assume the move alone did it.
- Don't chain several `move_cursor` calls with no screenshot between them hoping to
  "sweep" toward a target — move once to where you've already identified the target,
  from an already-fresh screenshot.

## Canonical Examples
- **Good:** A nav bar shows only icons; hovering usually reveals text labels →
  `move_cursor(x=920, y=40)` → wait briefly → screenshot → confirm label appeared →
  then `mouse_click` on the now-labeled item.
- **Good:** About to drag a slider from (400, 600) → `move_cursor(x=400, y=600)` →
  screenshot to confirm cursor is exactly on the slider handle → then `mouse_down`.
- **Wrong:** Moving to a button's coordinates and treating that as equivalent to
  clicking it — no state changes until an actual click or down/up event happens.

## Common Pitfalls
- Some hover effects need a short dwell time before they render (a tooltip fading in
  over ~300ms) — a screenshot taken instantly after the move can miss it. Wait briefly,
  then observe.
- Hover state is invisible in the tool's own return value — you only know it worked by
  screenshotting afterward.

## Post-Action Verification
Screenshot and check specifically for the hover-triggered UI (tooltip text, highlighted
row, revealed submenu) — not just that the cursor "looks" like it's in the right place.
