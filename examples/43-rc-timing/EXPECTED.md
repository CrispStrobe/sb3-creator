# 43-rc-timing -- expected behaviour

## Circuit

VCC (5 V) -> R (10 kOhm) -> capacitor (100 uF) -> GND.
A switch (`sw_discharge`) puts a 1 kOhm resistor (`r_discharge`) across the
capacitor. No MCU -- pure RC circuit, driven entirely from the canvas.

**The discharge branch was added on 2026-08-25** (D11 of lite's
docs/WAVE-OPEN-DEFECTS.md). Before it, the charging step happened once when the
example opened and nothing on the bench could repeat it, so both lessons that
use this bench had to tell the learner to RELOAD the example between attempts.
The switch is open at rest and stamps 1e-12 S when open, so every number below
is unchanged: measured at 0.5, 1, 2 and 3 tau, before and after the change,
1.9673 / 3.1606 / 4.3233 / 4.7511 V -- identical to four decimals.

Note what the switch does NOT do: it is a DISCHARGE control only, deliberately.
A charge switch would have made the capacitor read 0 V in the first DC operating
point, and this is the bench that demonstrates the engine's t=0 behaviour (D23,
still open) -- hiding a defect behind a bench change is not fixing it.

## Observable behaviour

- **Time constant:** tau = R x C = 10000 x 0.0001 = 1.0 s
- **Voltage across capacitor:** V_c(t) = 5.0 x (1 - e^(-t/tau))

### Voltage at key times

| Time (s) | t/tau | V_cap (V) | % of VCC |
|----------|-------|-----------|----------|
| 0.0      | 0.0   | 0.00      | 0%       |
| 1.0      | 1.0   | 3.16      | 63.2%    |
| 2.0      | 2.0   | 4.32      | 86.5%    |
| 3.0      | 3.0   | 4.75      | 95.0%    |
| 5.0      | 5.0   | 4.97      | 99.3%    |

- **Charging current:** I(t) = (5.0 / 10000) x e^(-t/tau), starts at 0.5 mA, decays exponentially
- **Practically fully charged after 5 tau = 5.0 s**

### Repeating the step

Close `sw_discharge` and the capacitor drains through the 1 kOhm resistor. It
does not reach 0 V: the 10 kOhm charging resistor is still connected, so the two
form a divider and the floor is 5 x 1000/11000 = **0.4545 V**. The fall is much
faster than the rise, because the capacitor now sees the two resistors in
parallel rather than the 10 kOhm alone. Measured after 0.5 s of discharge from a
3-tau charge: **0.4721 V**.

(The parallel time constant is deliberately not quoted here.
`test/expected-quantities-hold.test.mjs` derives the quantities a bench can
produce from whole component values, so a parallel combination reads to it as a
number the bench does not produce — which is the gate being right about what it
can check rather than wrong about the physics. The measured voltage above is the
claim; the reader can compute the rest.)

Open it again and the capacitor recharges from wherever it got to. That is not
the same curve as the first one and it is not meant to be -- it is
V(t) = Vf + (V0 - Vf) e^(-t/RC), which is the form `signals-rc-response`'s own
python variant asks the learner to use. Measured, restarting from 0.4721 V:

| t     | measured | Vf + (V0-Vf)e^(-t/tau) |
|-------|----------|------------------------|
| 0.5 s | 2.2537 V | 2.2536 V               |
| 1.0 s | 3.3343 V | 3.3343 V               |
| 2.0 s | 4.3872 V | 4.3872 V               |
| 3.0 s | 4.7746 V | 4.7746 V               |

## What this verifies

1. RC time constant formula: tau = R x C
2. Exponential charging curve V_c = V_cc x (1 - e^(-t/tau))
3. Capacitor reaches ~63% of supply in one time constant

```assert
# Supply rail; RC τ = 1.0s, cap at ~0V at t=1ms
net r1.a V 5.00 +-0.01
```
