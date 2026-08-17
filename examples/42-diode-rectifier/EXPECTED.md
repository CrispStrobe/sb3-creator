# 42-diode-rectifier -- expected behaviour

## Circuit

Two parallel paths from VCC (5 V):
- **Path 1 (forward-biased):** VCC -> D1 anode -> D1 cathode -> R1 (470 Ohm) -> green LED -> GND
- **Path 2 (reverse-biased):** VCC -> D2 cathode -> D2 anode -> R2 (470 Ohm) -> red LED -> GND

No MCU -- demonstrates diode polarity.

## Observable behaviour

### Path 1 -- diode forward-biased
- Diode conducts (Vf = 0.7 V drop)
- **LED current:** (5.0 - 0.7 - 2.0) / 470 = 4.9 mA
- **Green LED:** ON

### Path 2 -- diode reverse-biased
- Diode blocks current (no forward path from VCC through cathode to anode)
- **LED current:** 0 mA
- **Red LED:** OFF

## What this verifies

1. Diodes conduct in one direction only (anode to cathode)
2. A reverse-biased diode blocks all current
3. Forward-biased diode drops ~0.7 V (silicon)

```assert
# Forward diode: cathode at ~4.25V (5V - Vf)
net d1.cathode V 4.25 +-0.20
```
