# Aria Architecture — How This Fits Together

This folder is a drop-in replacement for the current monolithic prompt setup. It splits
one 60+ line block into three tiers that load at different times, so Aria only pays
the "context cost" of a given piece of knowledge when it actually needs it.

```
opencode.json                              ← loaded once, at session start
AGENTS.md                                  ← loaded once, at session start (referenced BY opencode.json)
.opencode/skills/<tool_name>/SKILL.md      ← loaded on demand, only when Aria calls skill({name:...})
```

## Why three tiers instead of one file

| Tier | What it holds | When it's read | Cost if unused |
|---|---|---|---|
| `opencode.json` | Identity + a pointer to AGENTS.md | Once, at boot | Negligible — a few lines |
| `AGENTS.md` | *How to think*: the loop, planning, failure handling, security | Once, at boot | Fixed, small — this is the only thing every task pays for |
| `SKILL.md` files | *How to use one specific tool*: exact parameters, gotchas | Only when explicitly requested via `skill()` | Zero — never loaded unless needed |

This is the direct fix for your first two pain points:
- **Token bloat**: the always-loaded content shrinks from "60+ lines of everything" to
  "identity pointer + AGENTS.md" — the tool-specific detail (the bulk of the old prompt)
  moves to files that are read maybe once or twice a session instead of every turn.
- **Tool parameter confusion**: instead of the old prompt trying to half-explain 8 tools'
  worth of parameters inline, each tool gets a dedicated file with an exact parameter
  table, so there's a canonical place to check `Return` vs `Enter`-style ambiguities
  instead of guessing.

The other two pain points are fixed by *content*, not structure:
- **Blind/hallucinated clicks** → the mandatory **Predict** step in AGENTS.md §2 forces
  Aria to state an expected outcome before acting, and to compare against it
  afterward — a vague "click and see" pattern can't satisfy that step.
- **Looping on failure** → AGENTS.md §5 requires a *diagnosis* and a *changed action*
  before any retry, with a hard budget of 2 diagnosed retries before the agent stops and
  reports a blocker instead of repeating itself indefinitely.

## How opencode.json hands off to AGENTS.md

OpenCode has a built-in mechanism for exactly this: an `"instructions"` array in
`opencode.json` that points at one or more markdown files. Anything listed there gets
read into the agent's system context once per session — it's the standard, supported way
to keep the JSON config itself tiny while still giving the agent a real policy document.
That's what `opencode.json` in this folder does: it holds almost nothing except a pointer
to `AGENTS.md`, plus the existing MCP server wiring for `mcp-bytebot-desktop`.

## How AGENTS.md hands off to the SKILL.md files

AGENTS.md never contains tool-specific detail — it only tells Aria *when* to go get
it (§6: first use of a tool this session, a failed call, an uncertain parameter, or a
non-routine use of a tool it already knows). Aria then calls `skill({ name: "<tool>" })`
which loads the matching file from `.opencode/skills/<tool_name>/SKILL.md` into context
for that moment, and it falls back out of context once it's no longer needed. Every
SKILL.md follows the same six-section template (see `SKILL_TEMPLATE.md`), so Aria
always knows where to look for a given kind of information without re-reading the whole
file top to bottom.

**One honest caveat worth flagging:** on-demand skill lookups are a known soft spot in
practice — agents sometimes skip consulting a skill file even when they should, simply
because nothing forces the call the way a always-loaded instruction does. AGENTS.md §6
tries to reduce this by naming concrete trigger conditions ("first use," "a call just
failed," "you're unsure of a parameter") rather than leaving it to vague judgment — but
if you notice Aria guessing at parameters instead of checking the relevant SKILL.md,
that's the thing to tighten first, e.g. by making the trigger conditions in §6 even more
explicit, or by having failed tool calls return an error message that itself says
"consult skill(<tool_name>) before retrying."

## What to actually do with these files

1. Replace your current `opencode.json` with the one in this folder (or merge the
   `"instructions"` and existing `"mcp"` blocks into your current file if you have other
   settings in there already — don't just overwrite blindly if you have more config than
   shown here).
2. Place `AGENTS.md` next to it, in the same project/config directory.
3. Place the `.opencode/skills/` folder (with its 7 tool folders) next to those two
   files, in the same directory structure shown above.
4. `SKILL_TEMPLATE.md` isn't read by the agent — it's for you (or whoever maintains this
   later) to use as a starting point if a new tool gets added to
   `mcp-bytebot-desktop` (e.g., the scrolling or clipboard-paste tools mentioned as
   available-but-currently-off in your brief).

## Suggested next step: measure it

Once this is running, the thing worth tracking is whether the pain points actually
shrank: average tokens per turn (should drop, since the old inline block is gone from
every message), rate of "retry the identical action" loops (should drop toward zero
given the §5 budget), and rate of `skill()` calls per task (gives you a sense of
whether the on-demand lookups are actually firing when they should).
