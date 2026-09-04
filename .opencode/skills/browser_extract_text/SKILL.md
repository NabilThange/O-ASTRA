# browser_extract_text

## Purpose
Extracts the main readable article/page text from the active browser tab using readability extraction. Strips away navigation chrome, ads, and noise to deliver clean markdown-like text directly to the agent.

## Parameters & Bounds
None. Operates on the active tab of the headed browser.

## When To Use
- After navigating to an article, documentation page, or search result, when you need to read the content to answer the user's question.
- Reading long articles or documentation without needing to parse fragmented snapshot nodes.

## When To Avoid
- Do not use when you need to find interactive controls to click or fill (use `browser_snapshot` for that).

## Canonical Examples
- **Good:** Navigate to documentation page -> call `browser_extract_text()` -> read title and text -> provide comprehensive answer to user.

## Common Pitfalls
- Calling on an empty tab or before page content has loaded.

## Post-Action Verification
Inspect the returned `title` and `text` to ensure it contains the expected content.
