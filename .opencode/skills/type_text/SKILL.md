# type_text

## Purpose
Types a string into whatever field currently has keyboard focus. Does not target a
coordinate — it relies entirely on focus already being in the right place.

## Parameters & Bounds
| Param | Type | Valid range | Default |
|---|---|---|---|
| `text` | string | any | required |
| `delay` | int (ms) | typically 0–100 | 12 |

## When To Use
- Immediately after clicking into a text field, search box, address bar, or terminal —
  and after confirming focus is actually there (see Pitfalls).
- Filling forms field-by-field: click field → verify focus → type_text → move to next
  field.

## When To Avoid
- Never call this "blind" hoping focus landed somewhere reasonable — a screenshot should
  show a visible cursor/caret or a highlighted active field first.
- Don't use it to type into a password manager's own vault UI if a native autofill
  mechanism (e.g., 1Password's fill button) is available — prefer the app's built-in
  fill to avoid ever having a secret pass through your own reasoning trace (see AGENTS.md
  §7).
- For very long text, avoid a single giant call with no checkpoint — consider chunking
  with an intermediate screenshot if the field has a length limit or live validation
  that could interrupt typing.

## Canonical Examples
- **Good:** Clicked address bar (confirmed blinking cursor in screenshot) →
  `type_text(text="https://example.com")` → `press_hotkey(["Return"])`.
- **Wrong:** Clicked what looked like a search box, but didn't verify the click actually
  landed inside the input (vs. on its label or icon) before calling type_text — text can
  silently go nowhere, or worse, trigger keyboard shortcuts if no field was focused.

## Common Pitfalls
- **Never assume focus. Confirm it.** The single most common failure mode of this tool
  is text vanishing because no field was actually focused — the click landed adjacent to
  the field, not inside it.
- Special characters and non-ASCII text may need escaping or a different input method
  depending on the target app — if a screenshot shows garbled or missing characters,
  don't just retry the same call; consult whether the app needs an IME or different
  encoding.
- Never echo a password or secret value in your own reasoning text before calling this —
  reference "the password field" or "the credential," not the value itself.

## Post-Action Verification
Screenshot and confirm the field now visibly contains the expected text (or, for
passwords, that masked characters of the right approximate length appeared) — not just
that no error dialog appeared.
