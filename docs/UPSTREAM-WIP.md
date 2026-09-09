# Adopting upstream changes during WIP

Our shared components are actively developed in our own upstream repositories:
`CrispStrobe/bw-board`, `CrispStrobe/bw-circuit-ui`, and `CrispStrobe/sb3-creator`.
Publish reusable engine, renderer and generator fixes there first. Keep
application preferences and packaging adaptations in Brickwright Lite.

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
5. In Lite, scoped sync preserves declared forks. Update tracked overlay/package
   mirrors and regenerate every census, report and ROM provenance stamp affected
   by the pin. Verify identity and behavior at that exact candidate.
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
