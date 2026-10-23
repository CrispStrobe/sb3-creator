# Programmable controller Widgets in pseudocode

DONE (source candidate) — Codex school-circuit owner, isolated source worktree
/private/tmp/sb3-school-circuit-projects-20261021, base37bfe287.

The actual Controller extension has controllerValue/controllerX/controllerY,
controllerPressed and setWidget, but the compiler has neither their parser /
decompiler phrases nor a controller runtime registry. Own narrow additions to
src/utils/sb3Creator.js for those existing operations, focused executable
round-trip and JS/Python emission controls, and this claim. Preserve argument
names and menu-shadow identity from bw-board b5650092 controller-extension.js.
No new synthetic instrument, controller model, generated foreign-extension
registry, device/compiler target, firmware or unrelated code change.

Expose named widget values, pressed state and setting input values through
pseudocode that compiles to the same real controller blocks. Ensure literal
names and expression values survive round trips, and no unsupported native
lowering is claimed. Lite owns runtime/widget bindings and example layouts in
its separate recorded claim. Claim precedes implementation; focused and enabled
hosted checks are required before landing and exact downstream adoption.

The compiler now supports `widget value/x/y/pressed "name"` and
`set widget "name" to value`, preserving the actual Controller opcodes and
arguments. Parse/decompile and Python/JavaScript driver-call controls pass.
The original school-example ownership also supplies the serialized organ
faceplate, a Space-key octave program and four saved AA/NiMH variants.
Component power ratings are display metadata (`part.limits.powerWatts`),
separate from electrical model parameters. The eight real switch/trimmer
bindings, variant serialization and shared-arm KCL pass against the declared
Board/Circuit models. 165 focused compiler/regression controls, the shipped
program controls and three actual model/binding controls pass locally without
skips. The derived device index agrees with its dry runs. Full hosted
qualification and downstream Widgets/audio implementation remain pending.

The first hosted candidate exposed missing variant directories/enrolment,
incorrect circuit-only organ classification, a four-pixel dog-leg body overlap,
unrecorded new numerical bounds and the standalone VM's missing built-in
Controller loader. Preserve that failed head and its original job. Each saved
battery variant now has its own circuit directory, the organ is `full`, and
canonical enrolment is regenerated (343 entries). Move the overlapping R11
body in all five figure layouts without changing electrical connections.
A focused default/variant geometry check prevents that overlap returning.
The VM harness executes the actual pinned Controller source and checks live
commands/reporters through SB3 Save/Open, with real project storage. Measured
network residuals are recorded beside the unchanged bounds; no ceiling grows.
All 39 affected metadata/layout/model controls, 60 VM controls and changed-file
lint pass locally. Hosted qualification of the repaired head remains pending.

The downstream full-corpus menu-shape gate caught missing WIDGETS shadows in
the newly authored Controller words after initial supplier landing. Repair the
same claimed parser/decompiler paths: literal names use the real dynamic menu,
computed names keep their reporter with that fallback shadow, and numeric-looking
names remain quoted. Preserve ownership, actual runtime behavior and unchanged
downstream assertions. Original failing source and new negative controls remain
retained; require supplier qualification before a new immutable Lite adoption.
