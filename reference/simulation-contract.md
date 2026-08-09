# The simulation contract — three boundaries

Companion to [`simulation.md`](simulation.md), which argues the architecture. This one fixes
the **interfaces**, because three pieces are being built in parallel by different people and
they must meet:

```
   MCU model (emu8051 / ucsim / tier-1 driver)
        ↕  boundary A — the pin bus
   board layer (netlist, solver, instruments)
        ↕  boundary B — parts, probes, transducers
   circuit designer UI
        ↑  boundary C — inference from the project
   BrickWright project (project.stc.pins)
```

**Settle A before the emulator work gets further**, or each emulator grows its own ad-hoc
coupling and they have to be reconciled afterwards.

**The point of A is that the board layer needs no emulator to be built or tested.** A scripted
MCU — a list of timestamped pin events plus expected read-backs — exercises the whole board
layer. Whoever builds the board can work in parallel with both emulator agents and be finished
before either.

---

## Boundary A — the pin bus (MCU ⇄ board)

The MCU is a black box that **owns time**. The board is passive and only ever answers.

```ts
type PinId   = string;                                    // "P1.0", "P3.2"
type PinMode = 'quasi' | 'pushpull' | 'input' | 'opendrain';

/** What the MCU tells the board. */
interface McuToBoard {
    /** The MCU changed what it does to a pin: its mode, its driven level, or both. */
    setPin(pin: PinId, mode: PinMode, driveHigh: boolean): void;

    /** Time has passed. Nanoseconds since reset; the board integrates RC/audio up to here. */
    advanceTo(tNs: bigint): void;
}

/** What the board answers. */
interface BoardToMcu {
    /** The resolved logic level the MCU would read back on that pin. */
    readPin(pin: PinId): 0 | 1;

    /** The ADC input as a VOLTAGE, 0…VCC. The MCU scales it to counts itself. */
    readAnalog(pin: PinId): number;
}
```

Four decisions, each of which matters:

1. **Pin state is `(mode, driveHigh)`, never a bare level.** A quasi-bidirectional `1` and a
   push-pull `1` are electrically different — one sources ~230 µA, the other drives hard. That
   distinction *is* the reason LEDs are wired active-low, so it must survive the interface.
   See `stc/docs/STC12-PERIPHERAL-MODEL.md` §3 for the Thévenin equivalent of each mode.
2. **The MCU must call `setPin` on mode changes too** — a write to `PxM0`/`PxM1` is a pin
   event, not just a write to `Px`.
3. **The board returns volts; the MCU converts to counts.** Result width, alignment and the
   `ADC_FLAG` dance stay in the MCU model where the datasheet put them (§4 of the peripheral
   spec); the board stays purely electrical. A board that returned 0…1023 would have to know
   which chip it is attached to, which is exactly what we are avoiding.
4. **The board never calls the MCU.** One direction of control, so there is no re-entrancy and
   no scheduler to agree on. `advanceTo` is how the board learns that time moved.
5. **Debugger pauses need nothing added here.** A halted MCU simply stops calling `advanceTo`,
   so board time stops with program time and the world freezes coherently. **Do not add a
   `pause()` to this interface**, and — the part that is not obvious — **do not catch up on
   resume** by passing the elapsed wall time: the board would integrate one enormous `dt` in a
   single step, and RC networks, PWM brightness averaging and buzzer frequency would all be
   wrong for a frame. `setControl` (boundary B) stays live while halted, because turning a knob
   is user intent rather than physics. The full rule, including what changes when the panel is
   mirroring *real* hardware instead of driving an emulator, is
   `stc12c5a60s2-lab/docs/DEBUG-CONTROL-MODEL.md` §3.1.

That is the entire coupling. It is small on purpose: both emulators can implement it cheaply,
and it constrains neither of their internals.

---

## Boundary B — parts, probes and transducers (board ⇄ UI)

```ts
type PartKind =
    | 'vcc' | 'gnd' | 'resistor' | 'capacitor' | 'diode' | 'led'
    | 'potentiometer' | 'button' | 'switch' | 'buzzer' | 'mcu';

interface Part {
    id: string;
    kind: PartKind;
    /** kind-specific: {ohms}, {farads}, {vf, color}, {ohms} for a pot, … */
    params: Record<string, number | string>;
    terminals: string[];              // "a" | "b" | "wiper" | a PinId for the mcu
}

interface Net { id: string; terminals: Array<{part: string; terminal: string}>; }

interface Board {
    setNetlist(parts: Part[], nets: Net[]): void;

    // ---- instruments -------------------------------------------------------
    nodeVoltage(net: string): number;                    // volts
    branchCurrent(part: string, terminal: string): number;  // amperes, into the terminal

    /**
     * Resistance between two nets. Returns the reason, NOT a number, when the board is
     * powered: a real DMM measures resistance with the power OFF, and a meter that
     * cheerfully reads ohms on a live circuit teaches the wrong physics. Encode that in
     * the type so it cannot be quietly ignored.
     */
    resistance(a: string, b: string): number | 'requires-power-off';

    // ---- transducers, for the UI to render and sound ------------------------
    ledBrightness(part: string): number;                 // 0…1, current × PWM duty over ~20 ms
    buzzerTone(part: string): {hz: number; on: boolean};

    // ---- user interaction --------------------------------------------------
    /** Pot position 0…1, button pressed 0/1, switch position. This is "turn the knob". */
    setControl(part: string, value: number): void;

    setPower(on: boolean): void;
}
```

Notes:

- **`ledBrightness` needs both mechanisms** or it will not feel right: the *current* through
  the LED (series R and Vf) and the *PWM duty* integrated over roughly 20 ms, which is what
  the eye does. One without the other looks wrong.
- **`buzzerTone` is derived, not driven**: the board measures the toggle period on the buzzer's
  net and reports a frequency. The UI feeds that to a Web Audio oscillator. Nothing in the MCU
  knows about sound.
- `branchCurrent` and `resistance` are the two calls that **force a real solver** (see
  `simulation.md`). Everything else has a closed-form fast path. Keep the solver behind this
  interface so the fast path stays the default.

---

## Boundary C — inference from the project

```ts
inferNetlist(stc: {device, clock, pins}): {parts: Part[]; nets: Net[]; notes: string[]};
```

`project.stc.pins` is already half a netlist — name, port.bit, direction, active-low. Default
suggestions, all of which the user may then redraw:

| declared | suggested parts |
|---|---|
| `OUTPUT ACTIVE LOW` | VCC → 1 kΩ → LED → pin (the wiring the asymmetry forces) |
| `OUTPUT` (active high) | pin → 1 kΩ → LED → GND |
| `ANALOG` | potentiometer across VCC/GND, wiper → pin |
| `INPUT` | button pin→GND, plus a pull-up |

And the **reverse check is the teaching feature**, nearly free once both sides exist: warn when
the code drives a pin with nothing attached, and when something is wired that the code never
references. Those go in `notes[]`.

---

## Testing without an emulator

The reason this contract exists. A **scripted MCU** is a fixture:

```ts
const trace = [
    {t: 0n,          setPin: ['P1.0', 'pushpull', false]},
    {t: 1_000_000n,  setPin: ['P1.0', 'pushpull', true]},
    {t: 2_000_000n,  expect: {readAnalog: ['P1.3', 2.5, 0.01]}},   // pot at midpoint
];
```

Assert node voltages, LED brightness and buzzer frequency against hand-computed values. The
divider, the LED and the RC step are all closed-form (`simulation.md`), so the expected numbers
can be worked out on paper — which makes them a real oracle rather than a snapshot of whatever
the code happened to produce.

Only when `branchCurrent` / `resistance` arrive does the solver appear, and it is checked the
same way: hand-computed answers for small networks first, then agreement with the closed-form
path on the cases both can handle.

---

## Boundary B, v2 — amendments (2026-08-09)

Adopted by the coordinator after the engine's solver rework landed (bw-board: op-amp
VCVS with rails, transient companion models, waveform sources, device registry).
Everything here is implemented in bw-board master; consumers may rely on it.
Per the standing rule, further changes go through `spec-updates/` in the proposing
repo — this section records what was adjudicated, so it is not relitigated.

### 1. Waveform sources (the function generator)

A `vsource` part accepts waveform params and the board evaluates them against
simulation time (`advanceTo` is still the only clock):

```ts
params: {
  volts?: number;                       // DC value (wave absent or 'dc')
  wave?: 'dc'|'sine'|'square'|'triangle'|'pulse';
  freq?: number;                        // Hz
  amplitude?: number;                   // peak deviation from offset
  offset?: number; phase?: number;      // volts; degrees
  duty?: number;                        // 0…1, square/pulse only
}
```

A UI "function generator" is a `vsource` with these params and nothing more.
`sourceVoltage(part, tSeconds, vcc)` is exported for a UI that wants to draw the
ideal waveform beside the measured one.

### 2. Op-amp rails

`opamp` params gain `railLow` (default 0) and `railHigh` (default VCC). The output
saturates at the rails. A model that lets an op-amp output kilovolts teaches the
wrong electronics; a UI may expose the rails but must not disable them.

### 3. Instantaneous capacitor semantics

Between `advanceTo` calls, a charged capacitor pins its nets at its stored voltage
(it IS a voltage source at an instant). Instruments therefore read the charging
current mid-transient, not the DC endpoint. No API change — a semantic guarantee.

### 4. Registered devices

`registerDevice(kind, model)` (bw-board `src/devices.js`) extends the part
vocabulary without touching the solver: a model declares `terminals`, optional
analog loading (`stamp`), behavioral state (`update`, run to a bounded fixpoint
after each solve; once per sub-step during transients — switching resolution is
one sub-step, a stated limit), and optional `branchCurrents`. Whatever the device
drives is a Thévenin source, exactly like an MCU pin. Built-in kinds cannot be
shadowed. Gates, shift registers, relays, motors, servos and timer ICs land as
device models, one file per device, in bw-board `src/devices/`.

### 5. Reserved: the scope tap

A waveform-capture API (fixed sample cadence, min/max decimation buckets, current
channels) is under proposal from bw-board (`spec-updates/scope-tap.md`). Until it
is adjudicated here, the existing probe API (`addProbe`/`getProbeData`) is the
interim surface and carries no cadence guarantee — a UI must not assume one.

### 6. Breadboard topology stays above boundary B

The breadboard model (bw-circuit-ui `src/model/breadboard.js`) derives `Net[]`
from holes, strips and jumpers and feeds `setNetlist` unchanged. No breadboard
concept crosses this boundary; the engine remains placement-blind.
