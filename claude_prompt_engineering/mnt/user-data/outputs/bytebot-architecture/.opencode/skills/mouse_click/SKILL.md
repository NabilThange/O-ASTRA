# mouse_click

## Purpose
Clicks at a pixel coordinate. The primary tool for pressing buttons, links, icons,
menu items, checkboxes, and tabs.

## Parameters & Bounds
| Param | Type | Valid range / values | Default |
|---|---|---|---|
| `x` | int | 0–1280 | required |
| `y` | int | 0–960 | required |
| `button` | enum | `left`, `right`, `middle` | `left` |
| `clickType` | enum | `single`, `double`, `triple` | `single` |

## When To Use
- Pressing any button, link, tab, checkbox, radio button, or menu item whose location
  you can see clearly in the current (fresh) screenshot.
- Desktop icons require `clickType: "double"` — a single click only selects/highlights
  the icon on this desktop environment, it does not launch the app.
- `triple` is for selecting a full line of text (e.g., in a text field before replacing
  it), not for launching anything.

## When To Avoid
- Don't use this to drag anything — that's `mouse_drag` (or `mouse_down`/`mouse_up` for
  fine-grained control). A single click at a start point and hoping does nothing useful
  for drag interactions.
- Don't click coordinates carried over from a screenshot taken before your last action —
  re-observe first (AGENTS.md §4).
- Don't use `double` click as a general-purpose "make sure it registers" habit on
  non-icon UI — many buttons interpret a double-click as two separate presses, which can
  trigger something twice (e.g., submitting a form twice).

## Canonical Examples
- **Good:** Screenshot shows a "Sign In" button centered at roughly (640, 410) →
  `mouse_click(x=640, y=410, button="left", clickType="single")` → Predict: dialog
  closes and a dashboard or redirect appears.
- **Good:** Screenshot shows the Firefox desktop icon at (58, 140) →
  `mouse_click(x=58, y=140, clickType="double")` → Predict: Firefox window opens within
  ~1–2s.
- **Wrong:** Clicking at the *edge* of a small checkbox (e.g., (302, 501) when the box
  spans only 298–304) — near-misses on small targets are the most common cause of
  "nothing happened" failures. Aim for the visual center, not an edge.

## Common Pitfalls
- Coordinates drift after a window is resized or moved — always re-observe after any
  window-geometry change before clicking inside it.
- A click that lands just outside a target's actual clickable bounds usually produces no
  visible error — it just silently does nothing. If Verify shows no change, suspect a
  near-miss before assuming the app is broken.
- If a modal/dialog is covering the target, the click will hit the modal instead — check
  the full screenshot for overlays, not just the region you expect the target in.

## Post-Action Verification
Compare against your stated Prediction specifically: did the expected window/dialog
open or close, did button state change (pressed/highlighted), did focus move to a new
field? A screenshot that "looks similar" is not confirmation — check the specific
element you predicted would change.
