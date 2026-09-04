# press_hotkey

## Purpose
Sends a keyboard key or key combination — X11-style key names, not browser/JS key
names. Used for shortcuts, navigation keys, and modifier combos.

## Parameters & Bounds
| Param | Type | Notes |
|---|---|---|
| `keys` | array of strings | Sent as a simultaneous combination if more than one; X11 keysym names, not JS `KeyboardEvent.key` values. |

Common key names (this is the table to consult instead of guessing):

| Intent | Key name(s) |
|---|---|
| Enter | `Return` |
| Escape | `Escape` |
| Copy | `Control_L`, `c` |
| Paste | `Control_L`, `v` |
| Select all | `Control_L`, `a` |
| Tab | `Tab` |
| Backspace | `BackSpace` |
| Delete | `Delete` |
| Arrow keys | `Up`, `Down`, `Left`, `Right` |

## When To Use
- Submitting a form/field with Enter instead of clicking a submit button.
- Standard OS/app shortcuts: copy, paste, select-all, close-window, switch-tab.
- Dismissing a dialog with Escape when no visible close button is present.

## When To Avoid
- Don't guess a key name from a browser/JS convention (`"Enter"`, `"Ctrl"`) — this API
  uses X11 keysym names (`Return`, `Control_L`). If a hotkey call fails, consult this
  skill again rather than trying likely-sounding variants one at a time.
- Don't use hotkeys for actions with a more discoverable, more certain visible-button
  equivalent, when you're unsure the shortcut applies in the current app.

## Canonical Examples
- **Good:** After typing a URL: `press_hotkey(["Return"])` → Predict: navigation
  starts.
- **Good:** Text selected, want to copy: `press_hotkey(["Control_L", "c"])`.
- **Wrong:** `press_hotkey(["Ctrl", "Enter"])` — neither name is valid in this system;
  the call will either error or silently no-op depending on the daemon's leniency.

## Common Pitfalls
- Left vs right modifier keys are distinct key names (`Control_L` vs `Control_R`) — use
  `_L` unless you have a specific reason to need the right-hand key.
- A hotkey combo that works in one focused app (e.g., browser) may do something
  different or nothing in another (e.g., terminal) — verify the correct window has
  focus before sending, especially after switching apps.
- Some combos are OS-level and will act on the whole desktop, not the focused app, if
  focus isn't where you think it is — always confirm focus via screenshot beforehand for
  anything destructive (e.g., a close-window shortcut).

## Post-Action Verification
Screenshot and confirm the specific expected effect (field cleared for select-all,
navigation started for Return, dialog dismissed for Escape) — hotkeys often have no
visible immediate feedback, so check the *downstream* effect, not the keypress itself.
