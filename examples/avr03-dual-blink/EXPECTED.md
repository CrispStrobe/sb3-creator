# avr03-dual-blink — expected behaviour

## Circuit

MCU D13 → green LED (Vf = 2.1 V) → 220 Ω → GND.
MCU D12 → red LED (Vf = 2.0 V) → 220 Ω → GND.

## Program

Two cooperative scripts (two `WHEN flag clicked` blocks):
- Script 1: blinks D13 at 1 Hz (500 ms on, 500 ms off)
- Script 2: blinks D12 at 2 Hz (250 ms on, 250 ms off)

Both run concurrently via the Duff's-device cooperative scheduler.

## Observable behaviour

| time (ms) | D13 (green) | D12 (red) |
|---|---|---|
| 0 | ON | ON |
| 250 | ON | OFF |
| 500 | OFF | ON |
| 750 | OFF | OFF |
| 1000 | ON | ON |

- **Green frequency:** 1 Hz
- **Red frequency:** 2 Hz
- **The pattern repeats every 1000 ms** (LCM of the two periods)

## What this verifies

1. Two cooperative scripts compile to `bw_task0` and `bw_task1`
2. Both scripts run concurrently — neither blocks the other
3. The scheduler dispatches both tasks per tick
4. The symbol table has two tasks, each with their own state/until/yields
5. A yield breakpoint on one task pauses both (the scheduler stops)

## Debugger test

With `symbols: true`, the response should contain:
- `bw_task0_state` and `bw_task1_state` in SRAM
- 3 yields per task (entry, forever top, wait)
- Setting a yield breakpoint on `(bw_task0, 2)` should pause at the first
  wait, with `bw_task1` sitting at its own wait state
