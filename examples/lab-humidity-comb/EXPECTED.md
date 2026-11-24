# lab-humidity-comb — expected behaviour

## Circuit
9 V. A humidity comb (two interleaved copper combs under a salt film) runs from +9 V to gate 1 of a
depletion-mode dual-gate MOSFET; 100 kΩ pulls gate 1 to ground. Gate 2 is tied to +9 V. A green LED with
470 Ω sits in the drain, the source on a red reference LED (2.2 kΩ from +9 V, about 1.65 V).
The comb's film resistance falls about tenfold for every 12 % of relative humidity: about 10 MΩ in room
air at 50 %, a few kilohms when breathed on.

## Observable behaviour
- Room air, 50 % (as loaded): the comb and the 100 kΩ divide the 9 V down to about 0.09 V at the gate,
  about 1.6 V below the source: the channel is pinched off and the green LED is dark.
- Move the humidity slider up: around 60 % the gate climbs above the pinch-off point and the LED starts
  to glow; by 70 % it is fully on (about 10 mA).
- Breath (about 90 %): the comb is a few kilohms, the gate sits close to the battery voltage, the LED is
  fully lit. Let the comb dry (slider back down) and the LED goes out again.

## What this verifies
1. A salt film's resistance falls steeply with humidity.
2. A MOSFET gate draws no current, so even a sensor of many megohms can drive it.

```assert
# room air, 50 % RH: gate held low, channel pinched, nothing through the green LED
net dual_gate_mosfet_7.gate1 V 0.09 +-0.02
net dual_gate_mosfet_7.source V 1.65 +-0.05
net dual_gate_mosfet_7.drain V 8.03 +-0.3
```
