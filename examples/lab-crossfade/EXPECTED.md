# lab-crossfade — expected behaviour

## Circuit
A 10 µF capacitor holds a voltage that sets the balance between two LEDs. TO GREEN charges it from +9 V through 100 kΩ; TO RED discharges it to ground through another 100 kΩ. Half 1 of an LM358 (on 9 V) is a voltage follower: the capacitor drives its non-inverting input, its output is tied to its inverting input. From the follower output, a red LED with 470 Ω goes up to +9 V and a green LED with 470 Ω goes down to ground. A voltmeter reads the follower output. Half 2 of the LM358 is parked as a grounded follower.

## Observable behaviour
- **Start:** the capacitor is empty. The follower output sits at about 1.25 V, not 0 V: the red LED's current flows into the output, and the LM358 cannot sink it without some voltage. Red carries about 12.4 mA, green is dark.
- **Hold TO GREEN:** the capacitor charges with a time constant of 100 kΩ × 10 µF = 1 s. The output follows it, so the light slides over: about 0.7 s after pressing, at the midpoint, both LEDs carry about 5.6 mA. Red keeps fading while green grows.
- **The follower runs out of headroom at the top:** the LM358 output cannot rise above about 6.62 V here. The capacitor keeps charging towards 9 V, but the light stops changing: green at about 10.0 mA, red at a faint 1.2 mA.
- **Release:** the capacitor holds its charge (nothing discharges it), so the light stays where it is.
- **Hold TO RED:** the same slide in reverse, again with τ = 1 s.

| Follower output | red LED | green LED |
|---|---|---|
| 2.0 V | 10.8 mA | 0.4 mA |
| 3.0 V | 8.8 mA | 2.5 mA |
| 4.5 V | 5.6 mA | 5.6 mA |
| 6.0 V | 2.5 mA | 8.8 mA |

- **Both glow in the middle:** red needs the output below about 9 − 2 = 7 V, green needs it above about 2 V. On 9 V those ranges overlap, so the LEDs crossfade. On a supply smaller than the two forward voltages added together, there would be a dark gap in the middle instead.

## What this verifies
1. An RC network makes a slow, smooth ramp.
2. A follower copies a high-impedance voltage (the capacitor) into a low-impedance output that can drive LEDs, without draining the capacitor.
3. One output can source current into one LED and sink current from another.

```assert
# t = 1 ms, capacitor empty
net u1.1_out V 1.25 +-0.05
net c_fade.a V 0.00 +-0.02
```
