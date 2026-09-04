# open_application

## Purpose
Directly opens or focuses a desktop application window without needing to find or double-click its desktop icon.

## Parameters & Bounds
| Param | Type | Valid range / values | Default |
|---|---|---|---|
| `application` | enum | `firefox`, `terminal`, `vscode`, `directory`, `1password`, `thunderbird`, `desktop` | required |

## When To Use
- To launch or bring Firefox to the foreground when starting any web browsing task.
- To open Terminal or VSCode directly.
- Much faster and more reliable than navigating to and double-clicking desktop icons.

## Canonical Examples
- **Open Firefox:** `open_application(application="firefox")` → Predict: Firefox window launches or brings existing session to focus.
- **Open Terminal:** `open_application(application="terminal")` → Predict: Terminal emulator window opens.
