# mouse_down / mouse_up

## Purpose
Low-level press-and-hold and release primitives. Used together (with `move_cursor` in
between) to build custom drag sequences that `mouse_drag` handles too crudely for —
e.g., a slider that needs several small intermediate moves, or a text selection that
spans a scroll.

## Parameters & Bounds
| Tool | Param | Type | Valid values | Default |
|---|---|---|---|---|
| `mouse_down` | `button` | enum | `left`, `right`, `middle` | `left` |
| `mouse_up` | `button` | enum | `left`, `right`, `middle` | `left` |

Neither takes coordinates — position the cursor first with `move_cursor`.

## When To Use
- Fine-grained drags where the drop target needs multiple intermediate positions (e.g.,
  a UI that only registers a drag if it sees several small motion steps, not one large
  jump — common in canvas/slider widgets).
- Click-and-drag text selection across a scrolling region.
- Any interaction docs describe as "press and hold X while doing Y."

## When To Avoid
- For a simple point-A-to-point-B drag (window move, icon reposition, simple slider),
  use `mouse_drag` instead — it's one call instead of three-plus and less error-prone.
- Never use `mouse_down` as a substitute for `mouse_click` on something that just needs
  a normal click — always pair it with a `mouse_up`, or you'll leave the button held.

## Canonical Examples
- **Good:** `move_cursor(400,600)` → `mouse_down(button="left")` →
  `move_cursor(450,600)` → `move_cursor(500,600)` → screenshot to confirm slider handle
  tracked → `mouse_up(button="left")`.
- **Wrong:** Calling `mouse_down` then immediately moving on to an unrelated action
  (e.g., `type_text`) without calling `mouse_up` first — this leaves the button
  logically "held," and the next click-like tool call will behave like a drag from
  wherever the cursor last was.

## Common Pitfalls
- **The single biggest risk with this pair: an orphaned `mouse_down` with no matching
  `mouse_up`.** If a task branches or fails mid-sequence, always issue the `mouse_up`
  before doing anything else, even if the original goal was abandoned.
- State persists across calls — the button stays "down" until you explicitly release
  it, even across several intervening tool calls. Track this in your reasoning
  explicitly ("button is currently held") so it isn't forgotten.
- Releasing over the wrong target (because the screen scrolled or the window moved
  mid-drag) drops the dragged item in the wrong place — re-observe right before the
  `mouse_up` if the drag spanned a large distance.

## Post-Action Verification
After `mouse_up`, screenshot and confirm the dragged element is at the destination —
not just that the mouse button was released. For selections, confirm the expected text
range is visually highlighted.
