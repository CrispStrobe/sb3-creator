# Adopting upstream changes during WIP

## Claimed animation resource words — 2026-10-07

The Arcade integration lane owns two reporter words for stable animation
resource IDs: frames and uniform interval. Both use native reporter-capable
`animationAssets` menu shadows. Literal IDs and computed IDs must roundtrip.
The consumer owns timeline editing, resource persistence/runtime/export; this
producer change only supplies the shared syntax and native block schema.


## Active Arcade block-schema work — 2026-10-07

Implemented by the Arcade compatibility integration lane: Arrays arithmetic,
unary and comparison operators and special values use native direct fields;
the controller axis uses a reporter input with its native menu shadow. Bare
`x`/`y` select the menu; parenthesized expressions connect reporters and quoted
text preserves literal spelling. Variables named `x` or `y` remain expressions
when reconstructed as Code. The decompiler reads native axis
menu shadows and validated historical literal shapes. Consumers can call
`normalizeArcadeBlockSchema(block)` before native workspace ingestion to migrate
these historical slots in place. Invalid literals and reporter-valued historical
dropdowns are preserved for explicit diagnostics; no value is guessed.
Focused tests exercise
every menu choice, menu edits, legacy migration and actual SB3 archive
reconstruction. Integration remains pending: adopt the reviewed producer SHA
in Brickwright Lite and qualify visible Blocks editing and persistence.
Sibling fixture pins and other engine lanes are unchanged.

Our shared components are actively developed in our own upstream repositories:
`CrispStrobe/bw-board`, `CrispStrobe/bw-circuit-ui`, and `CrispStrobe/sb3-creator`.
Publish reusable engine, renderer and generator fixes there first. Keep
application preferences and packaging adaptations in Brickwright Lite.

## Current delivery shapes

Do not apply one repository's adoption mechanism to all three:

| upstream | Brickwright Lite consumes it as | integrity authority |
|---|---|---|
| `bw-board` | npm dependency at an exact git SHA | Lite `vendor-pins.json` derives both package specs and the lockfile |
| `bw-circuit-ui` | npm dependency at an exact git SHA | the same Lite pin derivation |
| `sb3-creator` | transformed vendored source in two tracked mirrors | exact pin, map-derived rewrites, vendor identity, and mirror equality |

This repository separately checks out `bw-board` and `bw-circuit-ui` as
full-SHA CI fixtures. `.github/workflows/ci.yml` and
`test/fixtures/siblings.json` must agree exactly; missing inputs fail in CI
rather than turning cross-repository gates into skips. Those fixture pins and
Lite's shipping pins serve different consumers and may advance independently.

Landing protocol and source ownership are separate. A leaner CI/handoff process
may remove duplicate runs for an identical commit; it cannot waive an exact pin,
upstream-first ownership, range review, generated mirror, or identity gate.

A pin is the version this consumer has reviewed and adopted, not a promise to
follow the newest commit. Agents do not need to update it after every upstream
push. Batch related changes into one adoption after the upstream checks pass.
Do not let a test silently replace an unavailable SHA with HEAD.

1. Fetch and record an exact base; reconcile LANES and open branches before
   claiming work. Remote-tracking refs are shared by worktrees and can move.
2. Implement and test the complete producer/consumer contract upstream. Record
   its commit and hosted result, including skips and any unresolved failures.
3. Read the complete range since the consumer's old pin. Adopt a full 40-hex
   SHA deliberately; never substitute a branch name, short hash, or latest HEAD.
4. Update the existing authority once. Preserve corpus/fixture-derived pins
   where they bind inputs to reviewed baselines. Do not introduce another pin
   file for the same purpose. Sibling test pins and Lite's shipping pins serve
   different consumers and need not all advance together.
5. Apply the consumer's actual adoption mechanism. For `bw-board` and
   `bw-circuit-ui`, Lite moves `vendor-pins.json` and regenerates the derived
   package specifications and lockfile; it does not sync source copies. For
   `sb3-creator`, scoped sync updates both tracked mirrors and every affected
   census/provenance output. In this repository, sibling fixture moves update
   CI and `test/fixtures/siblings.json` together. Verify identity and behavior
   at that exact candidate.
6. Publish the candidate and its receipt. If main advances, inspect the intervening
   changes and rerun affected checks on the new candidate; do not force-push a
   shared branch or keep citing a superseded run as evidence for new code.

Workflow census gates discover new external checkout/clone sites. A new site
must have an exact reviewed input contract before it can pass. Static checks
cover recognized workflow syntax, not arbitrary dynamically constructed commands;
new syntax requires an explicit parser fixture and execution-path review.

Repository discovery and commit-graph queries are different operations from
building or executing a dependency. Keep them named, report the resolved SHA,
and never use their moving checkout as a substitute for an adoption pin. Lite's
existing fetch census records those exceptions individually.


## Claimed fresh animation resource lookup — 2026-10-07

The existing Arcade integration owner claims a distinct fresh-copy resource
reporter: `arcade animation fresh frames resource {RESOURCE}`. It allocates a
new array and fresh images on every evaluation; the existing shared frames
reporter keeps its semantics. Scope: `src/utils/arcadeDialect.js`, typed value
inference/decompilation/generators affected by the new opcode, associated
runtime-shim metadata, focused dialect tests and this handoff. Base33ce738.

Lite consumes this through its official exact-pin sync after producer hosted
checks pass. Consumer runtime, exporter, native importer and editable resource
library integration belong to the existing Lite Arcade lane. Literal UUID menus,
computed IDs, Python/JavaScript/pseudocode roundtrips and typed Image[] use must
remain supported. No shared-cache substitution for native factory lookups.


Fresh-lookup producer implementation: the new native-menu word and shared/fresh/
interval reversible host-runtime bridge pass284 focused dialect/roundtrip/C-host
tests, with no skips; affected source lint passes. The first run exposed the
expected opcode census change158→159. A later new assertion incorrectly looked
for a serialized block ID inside the block body; reading the owning target's
block map fixes that test. Both first-run failures are retained by the consumer
lane. Python/JavaScript now retain all three resource calls instead of empty
values. Their ordinary generated renderer shim is still a neutral host placeholder;
this qualifies language conversion, not standalone rendering. Hosted producer
qualification and exact-pin consumer adoption remain required.

## Claimed next Arcade protocols — 2026-10-15

The Arcade integration owner claims the bounded canonical procedure-constraint,
Throw and owned Image-to-Sprite producer sequence in
[next canonical Arcade protocols](ARCADE-NEXT-CANONICAL-PROTOCOLS.md).
This is a proposed documentation-only ownership contract. No new word, schema,
native capability, pin or default admission is implemented or qualified here.
Product implementation waits for qualified normal claim merge and the relevant
consumer claims. Coordinate one supplier sequence and one reviewed consumer
adoption; preserve unrelated active generator lanes and their sibling pins.

### Next Arcade protocols: canonical candidate

The three-word candidate implements `arcade_declareParameterConstraint`,
`arcade_throwValue` and `arcade_createOwnedImageSprite`: 402 operations and
407 spellings, preserving all previous entries. Procedure declarations use
fixed visible PROCEDURE/PARAMETER fields and a Number/Boolean/String/Any TYPE;
Code uses quoted literal selectors. The parser and decompiler validate the
actual containing DEFINE, prototype, ordered formals and prefix. Missing,
computed, duplicate or stale bindings refuse. A supported rename/reorder must
retain that association; an unsupported edit reports the stale binding.

Throw keeps its connected VALUE; the owned factory keeps IMAGE, TEMPLATE and
KIND. Neither word substitutes logging, a normal completion, a legacy String
factory nor a runtime ownership grant. The consumer validates primitive Throw
values and exceptional handoff, and separately validates actual owned Image,
Sprite creation completion, resource selectors and Number inputs. Canonical
Code/Blocks/SB3 roundtrips alone do not qualify those native semantics, default
admission or graphical authoring. Exact-head hosted checks and normal reviewed
supplier merge precede any separate consumer adoption or pin change.

## Arcade score threshold syntax — 2026-10-21

Two canonical words expose score registration and its matching callback hat.
PLAYER, SCORE, TOKEN and CAPTURES remain actual connected inputs; current Code
and SB3 reconstruction retain their values and edits. Text thresholds remain
text in this syntax layer: the Arcade consumer must enforce genuine Number
producers and fixed players rather than gaining authority from a word match.
The new portable source controls, full vocabulary membership and protocol
censuses require qualification. Runtime crossing order, pause completion,
original simulator equivalence, visible authoring and Lite adoption remain
separate consumer gates. No dependency or fixture pin changes are included.
