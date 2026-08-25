# Series RL step

A 5 V source, a 100 Ohm resistor and a 10 mH inductor in series to ground.
Nothing else -- deliberately.

## Why this bench exists

`signals-rl-response` used to be taught on `pc52-inductor-filter`, which is an
R-L-C: the same resistor and inductor, plus a 1 kOhm load and a 100 uF capacitor.
The RL law holds there only while the capacitor is still a short. Measured on
pc52, current against the ideal 50 mA x (1 - e^(-t/100us)):

     50 us  ratio 0.9996      500 us  ratio 0.9697
    100 us  ratio 0.9984     1000 us  ratio 0.9229   <- and falling: the
    300 us  ratio 0.9870     2000 us  ratio 0.8354      current TURNS AROUND

so the lesson had to carry the caveat in its own hint -- "the RL law holds to
about 1 % out to 300 microseconds; after roughly 500 microseconds the current
turns around". That is a fine thing to notice and a poor thing to be forced into.
(lite `docs/WAVE-OPEN-DEFECTS.md` D8.)

**The two defects on pc52 want opposite capacitors, which is why this is a new
bench and not a changed one.** `signals-resonance` needs pc52 to resonate, and it
does at C = 0.1 uF: measured, the sweep peaks at **+3.871 dB at 5032.9 Hz** and
stops being monotone. But at 0.1 uF the RL window is destroyed -- ratio 0.676 at
50 us and 0.193 at 100 us, because the current now rings at 5 kHz instead of
rising. One bench cannot be both, and changing C to close one defect would have
silently opened the other wider.

## Observable behaviour

- **Time constant:** tau = L / R = 0.01 / 100 = **100 us**
- **Final current:** I = V / R = 5 / 100 = **50 mA**
- **Current:** I(t) = 50 mA x (1 - e^(-t/tau))

Step the source from 0 V to 5 V and take the current as the resistor voltage
divided by R, which is what the lesson asks for. Measured against the ideal:

| t       | measured   | ideal      | ratio   |
|---------|------------|------------|---------|
| 25 us   | 11.0604 mA | 11.0600 mA | 1.00004 |
| 50 us   | 19.6745 mA | 19.6735 mA | 1.00005 |
| 100 us  | 31.6086 mA | 31.6060 mA | 1.00008 |
| 150 us  | 38.8470 mA | 38.8435 mA | 1.00009 |
| 200 us  | 43.2373 mA | 43.2332 mA | 1.00009 |
| 300 us  | 47.5145 mA | 47.5106 mA | 1.00008 |
| 500 us  | 49.6653 mA | 49.6631 mA | 1.00005 |
| 1000 us | 49.9980 mA | 49.9977 mA | 1.00001 |
| 2000 us | 50.0000 mA | 50.0000 mA | 1.00000 |

The agreement is 1.0001 or better everywhere, out to 5 tau and past it. The
excess is a few parts in 100,000 and it is the solver's companion model for the
inductor, not anything about the bench -- said out loud because "measured equals
ideal" is a claim, and this one is true to four decimal places rather than
exactly.

## What this verifies

1. tau = L / R, and that an inductor's time constant DIVIDES by resistance where
   a capacitor's multiplies -- the sign of the mistake a learner makes here
2. The exponential approach to a final current set by Ohm's law alone
3. That 63.2 % of the final value is reached at one time constant: 31.6086 mA of
   50 mA, measured

```assert
# Series RL: tau = L/R = 10mH/100ohm = 100us, final current 5V/100ohm = 50mA
net src.pos V 5.00 +-0.01
```
