# lab-ce-vs-follower — expected behaviour

## Circuit
9 V. A 22 kΩ resistor and a 10 kΩ potentiometer form the input divider (wiper range 0 to about 2.8 V).
The wiper drives two NPN stages at once:
- common emitter: 2.2 kΩ from +9 V to the collector, 1 kΩ from emitter to ground;
- emitter follower: collector straight to +9 V, 1 kΩ from emitter to ground.
Voltmeters on the input, on the common-emitter collector and on the follower emitter.

## Observable behaviour
- As loaded (pot at 0.5): input about 1.35 V, both emitters about 0.67 V, common-emitter collector about 7.53 V.
- Turn the input up: the common-emitter collector goes DOWN, about 2.2 times as far as the input moved
  (2.2 kΩ / 1 kΩ). It inverts and amplifies.
- The follower emitter goes UP by the same amount as the input, always about 0.7 V below it. No voltage gain,
  no inversion — but it can feed a load the divider could not.
- Below about 0.6 V input both transistors are off: the collector sits at 9 V and the follower output at 0 V.

## What this verifies
1. Common-emitter voltage gain ≈ −R_C / R_E.
2. Emitter-follower gain ≈ +1 with a 0.7 V offset.

```assert
# pot at 0.5
net potentiometer_4.wiper V 1.35 +-0.03
net npn_5.collector V 7.53 +-0.05
net npn_8.emitter V 0.67 +-0.03
```
