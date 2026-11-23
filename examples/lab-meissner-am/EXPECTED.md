# lab-meissner-am — expected behaviour

## Circuit
- 9 V supply. Q1 is a common-emitter stage: base divider 47 kΩ / 10 kΩ, emitter 220 Ω plus 820 Ω bypassed by 1 µF.
- In Q1's collector sits the tank: winding 1 of the transformer (10 mH) with 22 nF across it and 4.7 kΩ for its losses.
- Winding 2 (1 mH, coupling 0.9) sits between Q1's base and the divider, which 100 nF holds still. It carries the bias to the base and adds the fed-back swing, connected the way round that puts it in phase.
- Q2 is the modulator: the audio generator (500 Hz sine, 0.15 V, on a 0.65 V offset) feeds its base through 1 kΩ, and the carrier arrives through 1 nF and 47 kΩ. Collector load 2.2 kΩ, emitter 100 Ω.
- Scope channel 1 on Q1's collector, channel 2 on Q2's collector.

## Observable behaviour
- Q1 starts oscillating at once. Its collector swings around the supply voltage at f = 1 / (2π√(LC)) = 1 / (2π√(10 mH × 22 nF)), about 10.7 kHz.
- The swing is large, roughly 15 V peak to peak, because the tank voltage adds to the supply.
- On channel 2 the carrier pulses rise and fall with the audio: deepest where the audio is high, vanishing where it is low. The pattern repeats every 2 ms, the period of the 500 Hz tone. That is amplitude modulation.
- Turning the audio amplitude up makes the envelope pinch to nothing on every low half (over-modulation); turning it to zero leaves an even carrier.
- Swap the two leads of winding 2 and the feedback arrives upside down: no oscillation.

```assert
# supply (every other node is already swinging at 1 ms)
net vsource_2.pos V 9.00 +-0.01
```
