# browser_click

## Purpose
Clicks an element identified by its PinchTab accessibility key (e.g. `e10` or `[e10]`) or CSS selector.

## Parameters & Bounds
- `selector` (string, required): Element key from `browser_snapshot` (e.g. `"e10"` or `"[e10]"`) or CSS selector.
- `waitNav` (boolean, optional, default `true`): Wait for page navigation or network settling after click.

## When To Use
- Clicking buttons, links, tabs, checkboxes, or dropdowns discovered via `browser_snapshot`.
- Submitting search queries or forms.

## When To Avoid
- Guessing element keys without calling `browser_snapshot` first.
- Clicking an element key obtained before a page reload.

## Canonical Examples
- **Good:**
  ```json
  browser_click({ "selector": "e10" })
  ```
  Clicks the button identified as `[e10]` in the prior snapshot.

## Common Pitfalls
- Passing invalid or stale element keys. Always use fresh keys from the most recent `browser_snapshot`.

## Post-Action Verification
Call `browser_snapshot()` to verify the page changed or navigation finished, or call `take_screenshot()` to confirm visually.
