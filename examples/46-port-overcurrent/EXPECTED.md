# 46-port-overcurrent — the aggregate current lesson

## Circuit

8 LEDs on Port 1 (P1.0–P1.7), all active-low with 470 Ω resistors.
VCC → 470 Ω → LED → MCU pin, for each of the 8 pins.

## The lesson

Each pin individually is within spec: (5.0 − 2.0) / 470 ≈ 6.4 mA,
well under the 20 mA per-pin maximum. But 8 × 6.4 = **51.2 mA from
Port 1 alone** — nearly half the chip's total budget of ~120 mA
(STC12C5A60S2 datasheet §4.6).

With smaller resistors the problem becomes critical:
- 330 Ω: 8 × 9.1 = 72.7 mA — 60% of chip budget from ONE port
- 220 Ω: 8 × 13.6 = 109.1 mA — nearly the ENTIRE chip budget
- 100 Ω: 8 × 30.0 = 240 mA — DOUBLE the chip's total capacity

The failure mode is insidious: nothing burns out immediately. The port
voltage sags, every LED dims together, and if the supply is marginal
the chip browns out and resets — which a beginner reads as "my program
has a bug" and debugs for an hour in software.

## STC12C5A60S2 current limits (datasheet §4.6)

| limit | value | notes |
|---|---|---|
| Per-pin sink (quasi-bidirectional) | 20 mA | any mode |
| Per-pin source (quasi-bidirectional) | ~230 µA | weak pull-up |
| Per-pin source (push-pull) | 20 mA | strong pull-up |
| **Total chip I/O current** | **~120 mA** | all ports combined |

## Observable behaviour

| all 8 on | per-LED current | total Port 1 | % of chip budget |
|---|---|---|---|
| 470 Ω | 6.4 mA | 51.2 mA | 43% |

All 8 LEDs light simultaneously, each dimmer than a single LED would be
(due to voltage sag at the port level). A good simulator should show
this sag, or at minimum warn when aggregate current approaches the limit.

## What this verifies

1. 8 LEDs on one port all light (individually within spec)
2. The aggregate current (51.2 mA) is stated and checkable
3. **No circuit-time DRC warning exists yet** (as of 2026-08-10). `cToPseudocode`
   warns on pin declarations when reading C; the circuit designer does not warn.
   `bw-board` owns the DRC path; this example is the fixture for when it ships.
4. The example teaches the aggregate limit alongside the per-pin limit
