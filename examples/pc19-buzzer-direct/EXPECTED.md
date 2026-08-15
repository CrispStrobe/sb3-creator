# pc19-buzzer-direct — buzzer straight from a battery

## Circuit
5 V → 100 Ω → buzzer → return. No MCU, no program: the buzzer is meant to be
an **active** type, the kind with its own oscillator inside, so connecting it to
DC is supposed to be all it takes.

## Expected — electrically (measured, `audit-solve pc19-buzzer-direct`)

| node | volts |
|---|---|
| supply / R top | 5.0000 |
| R bottom = buzzer + | **2.5000** |
| return | 0.0000 |

The engine models the buzzer as a fixed **100 Ω**, so it forms an exact half
divider with the series 100 Ω:

- I = 5.0 / (100 + 100) = **25 mA**
- 2.5 V across the buzzer, 2.5 V across the resistor.

Halve the series resistor to 47 Ω and the buzzer voltage rises to 3.4 V; that
part of the example behaves and is worth reading.

## Expected — audibly: BLOCKED (engine-bug)

`buzzerTone()` reports `{hz: 0, on: false}` here and always will. The engine
derives a buzzer's tone **only from MCU pin edges** on the buzzer's net
(`board.js: _recordBuzzerEdges`, which requires a part of kind `mcu`), and
this circuit has no MCU. A DC-powered buzzer is therefore silent by
construction, even though bw-board's own source describes the `buzzer` kind as
the one "which has a built-in oscillator" (`devices/digital-ics.js:213`,
distinguishing it from `piezo`).

Intent and implementation disagree, so this is recorded as an **engine-bug**
(escalation E2 in `examples/AUDIT/pc13-pc24.md`) rather than papered over. The
circuit is not modified: it is the correct circuit for an active buzzer, and
this file will read "sounds continuously" once the model has the oscillator its
comment claims.
