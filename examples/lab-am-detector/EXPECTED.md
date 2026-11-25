# lab-am-detector — expected behaviour

## Circuit
**The test transmitter.** Three sine sources in series build an
amplitude-modulated signal on the bench, so that every stage of detection is a
waveform you can put on the scope: the full AM signal, the half-waves after the
diode, the carrier ripple on the capacitor. (The simulator's radio front end,
used by [lab-crystal-set](../lab-crystal-set), receives real medium-wave
stations, but it solves the carrier as an amplitude rather than as a waveform,
so none of those stages would show.) The three sources:

- carrier: 20 kHz, 3 V peak
- lower side frequency: 19.5 kHz, 0.9 V peak
- upper side frequency: 20.5 kHz, 0.9 V peak

Their sum is exactly a 20 kHz carrier whose amplitude swings between 1.2 V and
4.8 V five hundred times a second: a 500 Hz tone at 60 % modulation depth.
Real medium-wave carriers are around fifty times faster; the frequencies are
scaled down so the simulation stays quick. The idea is unchanged.

**The receiver.** 1 kΩ (the antenna's source resistance) → detector diode →
node ENV with a 10 nF smoothing capacitor and a 22 kΩ load to ground →
100 nF coupling capacitor → piezo "crystal earphone". The piezo is a
capacitor electrically, so through the coupling capacitor it also loads ENV a
little at audio frequencies: the envelope is somewhat flattened.

## Expected behaviour
- Before the diode: the full AM waveform, swinging symmetrically about zero.
- After the diode: only the positive half-waves survive.
- On the 10 nF capacitor: the carrier is smoothed away and the 500 Hz envelope
  remains — the tone. Its peaks sit one diode drop below the signal peaks.
- Too large a capacitor (try 100 nF): the voltage cannot fall as fast as the
  envelope does and the tone is smeared.
- Too small (try 1 nF): the capacitor drains between carrier peaks and a large
  20 kHz ripple rides on the tone.
- The coupling capacitor removes the DC part, so the earphone sees the audio
  only.

## Measured on the engine
Sampled every 10 µs from 3 ms to 8 ms (after the start-up), with the
authored 10 nF (`test/lab-circuits-1.test.mjs` repeats this):

| quantity | value |
|---|---|
| AM signal peak | 4.56 V |
| envelope maximum on ENV (at a carrier crest) | 3.22 V |
| envelope minimum on ENV | 0.75 V |
| difference between ENV and ENV 2 ms later | below 0.02 V |
| envelope period | 2 ms (500 Hz) |

The engine declines a single-instant check of this bench (its sources are
waveforms), so these numbers are held by the time-stepped test instead.

## What this verifies
1. AM is a carrier plus two side frequencies; adding them really gives a carrier with a varying amplitude.
2. A diode and a capacitor recover the envelope — the heart of every crystal radio.
3. The RC time constant has to sit between the carrier period and the audio period.

```assert
# t = 1 ms: the three sources all cross zero, so the antenna node starts at 0 V
net rsrc.a V 0.00 +-0.02
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b094eb2` and `bw-circuit-ui@0b594d6` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **4 of this page's 31** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-am-detector` prints them one by one.
<!-- engine-provenance -->
