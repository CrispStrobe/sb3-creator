# Super-regenerative VHF receiver

One VHF transistor that is switched into oscillation and out again 25 000 times a second by a quench generator. Each time it starts, its oscillation grows from whatever is in the tank at that moment: with a station, from the station's signal; without one, from the coil's own thermal noise. The stronger the start, the sooner the burst is full-size — so the average current, and the audio, follow the station. One transistor gets an enormous gain this way; between stations it hisses.

**Teaches:** exponential growth of an oscillator, quenching, super-regeneration, a VHF tank tuned by a varicap

## What to do

Click **Sim** and listen. Probe the emitter: the quench shows as a 25 kHz swing. Delete the antenna's station (its `stations` parameter) and listen again.

## What you should see

- The RF in the tank comes in bursts of a few volts, one per quench cycle; between bursts it falls back only to the station's level (a tenth of a volt).
- Without the station the bursts start from the noise floor, each from a different random amplitude, and the earphone hisses.
- With the station every burst starts at the same instant of the quench cycle, and early; from the noise each starts a little later and at a different instant every time. That wandering start is the hiss of a super-regenerator, and the steady start is why a station quiets it.
- In this set the effect on the sound is small: its bursts grow so fast that the noise moves their start by only a fraction of a microsecond. The simulation shows the bursts and their start; the faint programme and the quieting it does not claim.

## Why it works

During each half of the quench the stage has more gain than its losses: the tank's oscillation grows exponentially, from microvolts to volts in a few microseconds. How long that takes depends on where it starts — logarithmically on the station's signal — and so does the average rectified current at the emitter. The 10 kΩ / 10 nF filter keeps that average and drops the quench; it is the audio. The varicap's reverse voltage (the pot) tunes the tank; the FM station is received on the slope of its resonance.
