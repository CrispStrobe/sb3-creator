# Adopting upstream changes during WIP

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
