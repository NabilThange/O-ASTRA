# take_screenshot

## Purpose
Your only sensory input. Captures a real-time PNG of the full 1280×960 display. Every
other tool is "blind" without a fresh screenshot to ground its coordinates against.

## Parameters & Bounds
None. Always captures the full screen at native 1280×960 resolution.

## When To Use
- Before the first action of any task (baseline).
- Immediately after every action that could change the screen (see AGENTS.md §2/§4).
- After waiting for something async: page load, app launch, animation, dialog appearing.
- Whenever you're about to state a coordinate Prediction and aren't sure the last
  screenshot still reflects reality.

## When To Avoid
- Do not call it twice in a row with no intervening action or wait — if nothing should
  have changed, a second screenshot just burns tokens for the same pixels.
- Do not use it as a substitute for waiting: if you suspect an animation is
  mid-transition, wait briefly (a beat, not a fixed long sleep) before capturing, rather
  than capturing repeatedly until it looks done.

## Canonical Examples
- **Good:** Just clicked a "Login" button → take_screenshot → check for either a
  dashboard or an error banner.
- **Good:** Opened Firefox from a desktop icon → wait ~1s for window animation →
  take_screenshot → confirm window is present and fully rendered (not a half-drawn
  frame).
- **Wrong:** Called take_screenshot, then immediately called it again "to be sure" with
  no action or wait in between — this doubles cost for identical pixels.

## Common Pitfalls
- A screenshot taken too early after launching an app can capture a loading spinner or
  a half-rendered window — don't treat that as the final state; re-observe.
- Full-screen capture means small UI elements (checkboxes, close icons) can be only a
  few pixels wide — read carefully before committing to a coordinate rather than
  eyeballing a region.
- A screenshot only tells you what's *visible*; it says nothing about focus. A field can
  look active and not actually have keyboard focus — don't infer focus from appearance
  alone if the next action is `type_text`.

## Post-Action Verification
Not applicable — this tool *is* the verification step for every other tool.
