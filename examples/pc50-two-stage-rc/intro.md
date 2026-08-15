---
level: intermediate
age: 12+
prereqs: [pc06-rc-charge]
teaches: [cascaded-filter, attenuation, frequency-response]
---
## What you see
Two RC low-pass filters connected in series. A signal enters the first stage and emerges from the second noticeably smoother and more attenuated than after just one stage.

## Try this
1. Run the simulation and observe the voltage at the output of each stage — the second stage is smoother than the first.
2. Change the input frequency and watch how higher frequencies are attenuated more steeply than with a single stage.
3. Try making the two stages identical, then try different resistor values and compare the results.

## What is going on
Each RC stage attenuates high frequencies by the same rule: frequencies above the cutoff are reduced by 20 dB per decade. Cascading two stages doubles that to 40 dB per decade, producing a much steeper roll-off. However, the second stage also loads the first, so the combined cutoff frequency is lower than either stage alone. The overall effect is a filter that passes low frequencies cleanly and rejects high frequencies more aggressively.

## Why it matters
Single-stage RC filters are gentle — they let a lot of noise through near the cutoff. Cascading stages gives a steeper filter without needing inductors or op-amps, which is useful when you need better noise rejection with only passive components.

## Go further
- [pc06-rc-charge](../pc06-rc-charge) — the single-stage RC filter this builds on.
- [pc52-inductor-filter](../pc52-inductor-filter) — a different kind of passive filter using an inductor.
- Experiment: add a third RC stage and measure whether the roll-off steepens to 60 dB per decade as theory predicts.
