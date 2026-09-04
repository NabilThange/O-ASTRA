# SKILL.md Template

Every tool's SKILL.md follows this exact section order. Keep each section short — this
file is read on demand mid-task, not as a manual to study; it should answer "what do I
need to know right now" in under 30 seconds of reading.

```markdown
# <tool_name>

## Purpose
One or two sentences: what real-world action this tool performs and why it exists
alongside the other seven.

## Parameters & Bounds
A table or short list of every parameter, its type, valid range/enum, and default.
Be exact — this is the section that prevents guessed values.

## When To Use
The situations where this is the right tool, in concrete terms tied to observable
screen states.

## When To Avoid
The situations where this tool looks tempting but is wrong — usually because a
different tool is more precise, or because a precondition isn't met yet.

## Canonical Examples
2–4 short worked examples, each showing: the situation, the call (with real-looking
parameters), and the expected observable result. Include at least one example of a
call that looks reasonable but is actually wrong, labeled as such.

## Common Pitfalls
Bullet list of the specific ways this tool silently fails or misleads — stale
coordinates, timing issues, state that persists between calls, platform-specific
naming, etc. This is the highest-value section; write it from failure modes, not
from documentation.

## Post-Action Verification
What, specifically, to look for in the next screenshot to confirm this action
worked — not just "take a screenshot," but what pixel/UI change to expect.
```
