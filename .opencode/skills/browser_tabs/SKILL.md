# browser_tabs

## Purpose
Inspects all open browser tabs (IDs, titles, URLs, active status) or switches focus to a specific tab by ID.

## Parameters & Bounds
- `action` (string, optional, default `"list"`): `"list"` to view open tabs, or `"focus"` to bring a tab to the foreground.
- `tabId` (string, required when `action: "focus"`): The ID of the tab to focus (obtained from `browser_tabs({ action: "list" })` or `browser_navigate`).

## When To Use
- **Whenever visual screenshot and accessibility snapshot appear out of sync.** (e.g. screenshot shows a blank or previous tab, but snapshot shows the search results or target website).
- After clicking a link that opened in a new tab to find the new tab ID and switch to it.
- To inspect how many tabs are currently open in the browser.

## When To Avoid
- Do not call repeatedly in a tight loop without acting on the tabs.

## Canonical Examples
- **List open tabs:**
  ```json
  browser_tabs({ "action": "list" })
  ```
  Returns:
  ```text
  Open Browser Tabs (2):
  - [8C9DF662DEC71069F06D95DD68C8C4EB] "Hacker News" (https://news.ycombinator.com/) [status: active]
  - [FAB487A57327369F46DF328DFEF36586] "DuckDuckGo - Protection. Privacy. Peace of mind." (https://duckduckgo.com/) [status: active]
  ```

- **Switch to a tab:**
  ```json
  browser_tabs({ "action": "focus", "tabId": "FAB487A57327369F46DF328DFEF36586" })
  ```
  Brings the DuckDuckGo tab to the foreground visually and functionally.

## Common Pitfalls
- Assuming a tool failed when the target page simply opened in a new tab. Always check `browser_tabs` before reporting navigation or search failure!
