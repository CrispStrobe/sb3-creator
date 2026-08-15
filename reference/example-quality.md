# Example quality: gates, audit, and the intro layer

Three layers. Machines check what machines can check; agents judge what
needs judgment; the intro layer turns the gallery into a course.

## Layer 1 — deterministic gates (CI, no judgment)

Extends the existing examples gate. Each is a mechanical invariant:

1. **Category ⇔ content**: `mcu` part present ⇒ category is NOT a
   pure-circuit category AND `program.bw` declares ≥1 PIN (or the
   program is comment-only AND the index entry carries
   `"mcuIsProp": true` — an MCU drawn for realism with no program is
   legal only when declared).
2. **Liveness smell**: every pure-circuit example, solved with power
   on, must have ≥1 node at |V| > 0.5 — an all-zero solve is a broken
   example, not a subtle one.
3. **Program half loads**: for examples with both files, parsing
   program.bw yields the same device/pin set the app would need —
   already half-covered by gallery round-trip; add "pins nonempty when
   an MCU part exists".
4. **Expected-trace presence**: examples with programs carry expected/
   and the corpus differential covers them (existing machinery).
5. **Intro presence** (once layer 3 lands): every example has
   intro.md + intro.de.md with the required sections — a missing intro
   fails the gate, which is how the course stays complete.

## Layer 2 — the agent audit (one example, one report)

Per-example checklist an auditing agent walks IN THE RUNNING APP
(local build, Playwright or by driving the engine directly):

- Loads without console errors; canvas shows every part (no ghosts).
- DOES something: the titled phenomenon is observable (for
  33-inductive-no-flyback: the voltage spike at turn-off is visible on
  the scope; "no diode" vs "with diode" comparison works).
- Category, difficulty, and title match what is on screen.
- Instruments shown are the relevant ones (no debugger on pure
  circuits).
- Values are plausible (a 1k resistor showing 12 mA at 5 V, not 0).
- VERDICT: pass | content-fix (patch the example) | app-bug (file it
  with the exact repro) — plus the fix applied where content-level.

Auditors: Opus-class agents, one example at a time, reports appended
to a single AUDIT.md ledger (id, verdict, what was fixed, what was
filed). The ledger is the input to layer-1 rule hardening: every
app-bug class found becomes a new deterministic check where possible.

## Layer 3 — the intro layer (modular course)

Every example gets `intro.md` + `intro.de.md`, fixed sections so the
app can render them uniformly and courses can compose them:

```markdown
---
level: beginner | intermediate | advanced   # matches difficulty
age: 8+ | 12+ | 16+                         # wording tier, not a lock
prereqs: [pc01-led-resistor]                # example ids
teaches: [flyback, inductance]              # concept tags
---
## What you see        (2-3 sentences, plain words)
## Try this            (numbered, concrete: "turn the pot", "click Sim")
## What is going on    (the physics/logic, age-tiered wording)
## Why it matters      (1-2 sentences, the real-world hook)
## Go further          (links: next examples by id, one experiment)
```

Rules: EN + DE from day one (the bilingual law); wording for the `age`
tier but never condescending; `prereqs`/`teaches` are what turns the
set into a DAG — a course path (8yo LED start → adult flyback diodes)
is a walk over that DAG, which the app can render as a Scratch-style
guided tutorial later without new content work. Inspiration noted from
Scratch tutorials/onboarding; our own design is this schema.
