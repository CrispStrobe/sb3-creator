# Programmable controller Widgets in pseudocode

CLAIMED — Codex school-circuit owner, isolated source worktree
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
