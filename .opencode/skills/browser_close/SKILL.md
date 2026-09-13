# browser_close

## Purpose
Closes the currently active tab in the visible headed browser. Used to dismiss finished pages and keep the browser workspace clean and responsive.

## Parameters & Bounds
None. Closes the currently focused active browser tab.

## When To Use
- After finishing inspection, text extraction, or scraping on a specific webpage or search results page.
- To clean up accumulated tabs (see AGENTS.md §6 Pitfall C: "Leaving Cluttered Tabs").
- When a tab is unresponsive or navigation resulted in an unwanted modal/popup.

## When To Avoid
- When it is the only open tab and you still need to browse — navigate to the next URL via `browser_navigate()` instead of closing and reopening.
- If you have unsaved form inputs in that tab.

## Canonical Examples
- **Good (Close active tab):**
  `browser_close()` → Predict: Active tab closes, focusing adjacent tab or revealing desktop.

## Common Pitfalls
- Closing a tab when work is still in progress in that tab. Confirm data is extracted before closing.

## Post-Action Verification
Call `browser_tabs({ "action": "list" })` or `take_screenshot()` to confirm the tab count decreased and the expected tab is now foregrounded.
