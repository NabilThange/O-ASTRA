# browser_type

## Purpose
Types text into an input field or textarea identified by its PinchTab accessibility key (e.g. `e9`) or CSS selector. Optionally presses Enter / Return after typing.

## Parameters & Bounds
- `selector` (string, required): Element key from `browser_snapshot` (e.g. `"e9"` or `"[e9]"`) or CSS selector.
- `text` (string, required): The text to type into the field.
- `pressEnter` (boolean, optional, default `false`): Automatically presses Enter after typing (useful for search bars).
- `waitNav` (boolean, optional, default `false`): Wait for page navigation after submitting with Enter.

## When To Use
- Typing search queries into search inputs.
- Filling form fields (textboxes, textareas).
- Entering URLs or keywords.

## When To Avoid
- Typing into an element without checking its key via `browser_snapshot`.

## Canonical Examples
- **Good (Search & Submit):**
  ```json
  browser_type({ "selector": "e9", "text": "Aria AI", "pressEnter": true, "waitNav": true })
  ```
  Types "Aria AI" into textbox `e9`, presses Enter, and waits for the search results page to load.

## Common Pitfalls
- Setting `waitNav: true` when `pressEnter: false`, which may cause an unnecessary wait timeout.

## Post-Action Verification
Call `browser_snapshot()` or `take_screenshot()` to verify the search results or filled field.
