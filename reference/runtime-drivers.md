# Runtime / hardware extensions — the pluggable-driver convention

How Brickwright transpiles **runtime/hardware** extensions (Gamepad, LEGO Boost/Spike/EV3/NXT/
WeDo/PoweredUp, …) to Python/JavaScript, and how that lines up with the real driver ecosystem.

## The convention

The transpiled program is **driver-agnostic**. A hardware block becomes a method call on a
per-runtime driver object:

```
_boost.motorOn("A")        # command  (side effect)
d = _boost.distance("1")   # reporter (sensor read)
```

The **driver** is emitted at the top and is the single **swap point**. The program never
changes; you swap the driver to change what "run" means. Ops are declared in the data-driven
`SB3Creator.RUNTIME_EXTENSIONS` registry (`{ extId: { runtime, ops: { opcode: {kind, method,
args, neutral} } } }`) — adding a hardware extension is one registry entry, not new emitter code.
Menu args (motor port, button) resolve to their field values.

## The three driver modes (the switch)

`generatePython(project, {driver})` / `generateJavaScript(project, {driver})`:

| mode | what it emits | backs onto |
|------|---------------|-----------|
| **`shim`** (default) | neutral no-op driver: commands do nothing, reporters return `0`/`false` | nothing — runs anywhere, drives nothing |
| **`remote`** | a driver that forwards each call to a **Brickwright bridge** over WebSocket (normalized JSON) | **github.com/CrispStrobe/brickwright-bridges** — `universal_lego_bridge.py` / `lego_bridge*.py` speak BTC / BLE / ScratchLink / Web Serial / local WebSocket and encode per device (`from_normalized({"command","args"}) → device binary`) |
| **`ondevice`** | a header pointing at the on-brick target; the real device code is produced by the per-hardware transpilers | **github.com/CrispStrobe/extensions** (`extensions/CrispStrobe/`) — `ev3dev_py_transpile.js` emits real `ev3dev2` Python (`Motor.on_for_rotations`, `UltrasonicSensor`, `Sound`, …); also `legospike_turbowarp_transpile.js`, `legonxt_transpile_universal.js`, `ev3_lms_transpile.js`. Hardware-validated for ev3dev (44/44 smoke cases on a real brick, 2026-05-05) |

Planned switches that layer on the same program: **async/await** (BLE is async → `await
_boost.motorOn(...)`) and **event hats** (`whenButtonPressed` → driver callback registration).

## Source of truth / division of labour

- **Extension block surface** (opcodes, args, semantics): `CrispStrobe/extensions`
  (`extensions/CrispStrobe/*.js`; canonical copies pinned in `reference/extensions/`).
- **On-device Python bridges + protocol docs** (BTC/BLE/ScratchLink/Web Serial/WebSocket):
  `CrispStrobe/brickwright-bridges` (`ev3dev_ondevice.py`, `universal_lego_bridge.py`,
  `nxt_bridge.py`, `ev3-compiler-service/`, `README_*bridge*.md`, `LEARNINGS.md`).
- **On-brick transpile** (block → ev3dev/pybricks/spike/nxt code): the four transpilers in the
  extensions repo. Brickwright's `ondevice` mode **reuses** these rather than reimplementing them.

Brickwright's job is the driver-agnostic program + the `shim`/`remote` drivers; the real
hardware backends already exist in those two repos. "Note what we do here" — this file is that note.
