# desktop

## Purpose
Guide for operating the lightweight Ubuntu XFCE desktop environment (1280×960, display `:0`). Covers window management, application launching, desktop layout, and minimizing windows to show the clean desktop.

## Parameters & Invocation
To minimize all windows and reveal the bare desktop:
```json
open_application({ "application": "desktop" })
```

## Desktop Environment Layout
- **Display Resolution**: Exactly `1280 x 960` pixels (`0 <= x <= 1280`, `0 <= y <= 960`).
- **Top / Bottom Panel**: XFCE panel with task list, clock, and system status.
- **Filesystem Paths**:
  - Desktop folder: `/home/user/Desktop`
  - User home: `/home/user`
  - Downloads: `/home/user/Downloads`

## Window Fullscreen & Maximize
Always prefer running applications maximized or full screen for optimal element visibility:
- **Fullscreen Mode:** `press_hotkey({ keys: ["F11"] })` (works in Firefox, Terminal, Evince, etc.)
- **Toggle Maximize Window:** `press_hotkey({ keys: ["Alt_L", "F10"] })` (XFCE window manager shortcut)

## Installed Applications & Automation
Launch any installed application directly with `open_application({ "application": "<key>" })`:

| Key | Application | Best For |
|---|---|---|
| `firefox` | Firefox ESR | Web browsing (or use `browser_*` tools) |
| `terminal` | XFCE Terminal | CLI commands, scripts, bash automation |
| `mousepad` | Mousepad Text Editor | Fast plain text / markdown / code inspection |
| `calc` | LibreOffice Calc | Spreadsheets (`.xlsx`, `.xls`, `.csv`, `.ods`) |
| `evince` | Document Viewer | PDF and document reading |
| `eog` | Eye of GNOME | Image inspection |
| `paint` | KolourPaint | Paint, canvas sketching, image markup |
| `calculator` | GNOME Calculator | Rapid arithmetic, math evaluations |
| `directory` | Thunar File Manager | Graphical directory and file management |
| `vscode` | Visual Studio Code | IDE and codebase navigation |
| `desktop` | XFCE Desktop | Minimize all open windows to reveal desktop |

## When To Use
- To clear the screen and minimize cluttered windows when switching tasks or verifying background state.
- When you need to reference the installed desktop applications roster or local file storage locations.
- When generating files to display on the user's desktop (`/home/user/Desktop/`).

## When To Avoid
- Do not manually click individual minimize buttons on multiple windows — call `open_application({ "application": "desktop" })` once to minimize all.
- Do not manually click spreadsheet cells in LibreOffice Calc to create data — generate `.xlsx` or `.csv` programmatically in Python/Node via `terminal` or scripts, then view it with `open_application({ "application": "calc" })`.

## Canonical Examples
- **Show clean desktop:**
  `open_application({ "application": "desktop" })` → Predict: All open application windows are minimized and the desktop wallpaper and icons become visible.
- **Launch Paint for drawing task:**
  `open_application({ "application": "paint" })` → Predict: KolourPaint window launches maximized or centered.

## Common Pitfalls
- Assuming desktop icons are always at fixed pixel coordinates. Use `open_application` instead of hardcoding double-clicks on desktop icons.
- Generating output files in temporary directories that the user cannot easily inspect on the desktop. Save user-facing files in `/home/user/Desktop/`.

## Post-Action Verification
Call `take_screenshot()` to confirm the desktop is visible and foreground window focus is in the expected state.
