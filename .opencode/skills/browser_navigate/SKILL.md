# browser_navigate

## Purpose
Navigates the headed browser (PinchTab / Chrome on DISPLAY=:0) to the target URL. Launches the browser window if it is not already running.

## Parameters & Bounds
- `url` (string, required): Full URL to navigate to (e.g. `https://duckduckgo.com`, `https://news.ycombinator.com`). Must include protocol scheme (`http://` or `https://`).

## When To Use
- Whenever the user asks to visit a website, search the web, or browse online documentation.
- When changing URLs or loading a fresh web page.

## When To Avoid
- Do not use for clicking links within an already-loaded page where `browser_click` on an element key (`[e...]`) is faster and maintains session state.

## Canonical Examples
- **Good:** `browser_navigate({ url: "https://duckduckgo.com" })` -> navigates browser to DuckDuckGo homepage.
- **Good:** Follow up immediately with `browser_snapshot()` or `take_screenshot()` to inspect the loaded page.

## Common Pitfalls
- Forgetting `https://` prefix. Always provide the full protocol.
- Assuming the page is done rendering before calling `browser_snapshot()`. Allow network calls to finish.

## Post-Action Verification
Call `browser_snapshot()` to verify the page title and interactive element tree, or `take_screenshot()` to see the rendered window on the desktop.
