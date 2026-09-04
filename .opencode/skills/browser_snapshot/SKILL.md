# browser_snapshot

## Purpose
Captures the compact Accessibility Tree of the currently open webpage in PinchTab. Provides stable element references (e.g. `[e1]`, `[e5]`, `[e12]`) with roles, labels, and text, allowing precise interaction without blind pixel clicking or token-heavy HTML DOM dumping.

## Parameters & Bounds
- `filter` (string, optional): Filter level for returned nodes. Options: `"interactive"` (default, only clickable/fillable elements) or `"all"` (all elements including static text).

## When To Use
- After `browser_navigate` to inspect interactive elements (buttons, inputs, links).
- After `browser_click` or `browser_type` to verify the action succeeded and inspect new page elements.
- When you need to find the exact element selector (e.g. `e5`) for `browser_click` or `browser_type`.

## When To Avoid
- Calling repeatedly without any intervening action.

## Canonical Examples
- **Good:** `browser_snapshot({ filter: "interactive" })` -> returns element list:
  ```text
  [e0] link "Homepage"
  [e9] textbox "Search with DuckDuckGo"
  [e10] button "Search"
  ```
  Now you know to type into `e9` or click `e10`.

## Common Pitfalls
- Page reloads or dynamic SPA updates regenerate element references. Always re-run `browser_snapshot` after navigation or major UI changes before using an element key.

## Post-Action Verification
Inspect the list of returned element refs and verify the expected UI controls are present.
