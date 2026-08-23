# 41-pot-as-dimmer -- expected behaviour

## Circuit

VCC (5 V) -> pot (10 kOhm, terminal a).
Pot terminal b -> GND.
Pot wiper -> R1 (220 Ohm) -> red LED (Vf = 2.0 V) -> GND.

No MCU -- pot position directly controls LED brightness.

## Observable behaviour (position = 0.5, wiper at midpoint)

The wiper is LOADED, and that changes the answer enough to matter. Looking into
the wiper the divider is a 2.5 V source behind 5k || 5k = 2.5 kOhm, and the load
hanging off it is 220 Ohm plus an LED. The source impedance dominates by an
order of magnitude, so the unloaded midpoint is not what the node sits at:

- **Wiper voltage:** 2.0301 V, not 2.5 V
  I = (2.5 - 1.9887) / (2500 + 220) = 0.188 mA
  V_wiper = 2.5 - 0.188 mA x 2500 = 2.0301 V
- **LED forward drop:** 1.9887 V
- **LED current:** 0.188 mA - not the 2.3 mA an unloaded 2.5 V wiper would give

That 12x difference is the lesson this bench actually teaches: a 10 kOhm pot is
a stiff-looking divider that a 220 Ohm load collapses. Read as a dimmer it
under-delivers; read as a demonstration of source impedance it is a good bench.

The numbers above were hand-derived, and until 2026-08-23 the engine disagreed
with them: a closed-form solver path returned the unloaded 2.5000 V while the
load drew its full current from that node, which is a KCL violation of 2.17 mA.
`test/kcl-residual.test.mjs` exists because of this bench.

### At different pot positions

UNLOADED approximations - the table shows the divider alone. Under the real
load every entry sits lower, as the measured midpoint above shows.

| Position | V_wiper (unloaded) | I_LED (mA) | LED state      |
|----------|-------------------|------------|----------------|
| 0.0      | 0.0 V             | 0          | OFF (below Vf) |
| 0.3      | 1.5 V             | 0          | OFF (below Vf) |
| 0.5      | 2.5 V             | 2.3        | dim            |
| 0.7      | 3.5 V             | 6.8        | medium         |
| 1.0      | 5.0 V             | 13.6       | bright         |

Note: wiper voltage is approximate since load current affects the divider.
The 220 Ohm series resistor protects the LED at full rotation.

## What this verifies

1. Potentiometer as a variable voltage divider
2. LED has a threshold (Vf) below which it does not conduct
3. Series resistor limits maximum current at full rotation

```assert
# Pot at 50%, WITH the load: the wiper is not the unloaded midpoint.
# 2.5 V behind 5k||5k = 2.5k, load 220R + LED -> I = 0.188 mA, wiper = 2.0301 V.
net pot1.wiper V 2.03 +-0.05
net led1.anode V 2.02 +-0.15
```
