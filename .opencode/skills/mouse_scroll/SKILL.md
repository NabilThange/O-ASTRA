# mouse_scroll

## Purpose
Scrolls the mouse wheel up, down, left, or right at the current cursor location or specified coordinates. Used to reveal content in scrollable windows, document viewers, and web pages.

## Parameters & Bounds
| Param | Type | Valid range / values | Default | Description |
|---|---|---|---|---|
| `direction` | string | `down`, `up`, `left`, `right` | `down` | Direction of the scroll action |
| `scrollCount` | number | `>= 1` integer (typically 1 to 10) | `1` | Number of scroll steps / wheel ticks |
| `x` | number | `0 <= x <= 1280` | optional | Target X coordinate to position cursor before scrolling |
| `y` | number | `0 <= y <= 960` | optional | Target Y coordinate to position cursor before scrolling |

## When To Use
- To scroll down a long document in Evince, text in Mousepad, or output in Terminal.
- To scroll through application lists or tables in desktop GUI windows.
- To move down in a web page when operating in headed browser mode if keyboard PgDn/Down arrows are not applicable.

## When To Avoid
- When reading web page contents or search results — use `browser_snapshot()` or `browser_extract_text()` instead, which retrieves complete page text and accessibility trees without needing physical mouse scrolling.
- When the target window does not have focus. Hover over or click the scrollable container first.

## Canonical Examples
- **Good (Scroll down document):**
  `mouse_scroll({ "direction": "down", "scrollCount": 5, "x": 640, "y": 480 })`
  Positions cursor at the center of the window and scrolls down 5 increments.
- **Good (Scroll up):**
  `mouse_scroll({ "direction": "up", "scrollCount": 3 })`
  Scrolls up 3 increments at current cursor position.
- **Wrong:**
  `mouse_scroll({ "direction": "bottom" })` — Invalid direction enum; valid values are strictly `down`, `up`, `left`, `right`.

## Common Pitfalls
- Calling `mouse_scroll` over an area that is not scrollable (e.g. static canvas or window border). Always specify `x, y` within the scrollable content viewport.
- Scrolling too far in one call (e.g. `scrollCount: 50`) which may overshoot the target content entirely. Prefer increments of 3–8 steps, followed by `take_screenshot()`.

## Post-Action Verification
Call `take_screenshot()` and verify the scrollbar position moved or new content appeared on screen.
