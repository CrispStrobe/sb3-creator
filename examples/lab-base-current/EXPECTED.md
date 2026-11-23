# lab-base-current — expected behaviour

## Circuit
9 V. Collector path: ammeter, 1 kΩ, red LED, NPN (beta 100). Base path, selected by a slide switch:
position a = ammeter, 10 kΩ and a 1 MΩ potentiometer used as a variable resistor (wiper tied to one end);
position b = a button in series with 2.2 MΩ (a stand-in for a damp fingertip). Emitter to ground.

## Observable behaviour
- As loaded (pot at 0.8, so 10 kΩ + 200 kΩ in the base): base current about 39.6 µA, collector current about 3.96 mA.
  Collector current divided by base current is 100 — the transistor's current gain.
- Turn the pot towards its full 1 MΩ: both currents shrink together and the LED dims, the ratio stays 100.
- Turn it to the 10 kΩ end: the base current rises to about 0.83 mA, but the collector current stops at about 6.8 mA,
  because the LED and 1 kΩ cannot pass more. The transistor is saturated; the ratio drops far below 100.
- Slide the switch to the fingertip side: with the button released the base is open and no collector current flows.
  Press the button: 2.2 MΩ gives a base current under 4 µA and still about 0.38 mA flows in the collector.
- A transistor that conducts with its base open would be faulty — the same bench is a quick transistor tester.

## What this verifies
1. Collector current = beta × base current in the active region.
2. Saturation: once the load limits the current, more base current changes nothing.

```assert
# pot at 0.8: Ib = 39.6 uA, Ic = 3.96 mA, transistor active
net npn_12.base V 0.68 +-0.03
net npn_12.collector V 3.20 +-0.10
```
