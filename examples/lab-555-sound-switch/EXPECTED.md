# lab-555-sound-switch — expected behaviour

## Circuit
- 9 V supply. A loudspeaker (speaker_3) is the microphone. Preamp: 1 µF into an NPN (npn_5; 1 MΩ collector-to-base, 10 kΩ load, 470 Ω emitter), 100 nF into a second NPN (npn_10; 1 MΩ, 10 kΩ, 100 Ω emitter).
- 1 µF passes the second collector's positive peaks through the slide switch (slide_switch_15, left) to a third NPN (npn_18; 100 kΩ base to ground, off at rest), whose collector (10 kΩ up) is the trigger of a 555 monostable (timer_555_21; 100 kΩ, 22 µF: about 2.4 s). 100 kΩ and 10 µF hold its reset low for the first 0.35 s.
- Slide switch right: a phototransistor (phototransistor_16, 0.5 mA at full light; 47 kΩ down) drives the same NPN instead.
- Output → relay (relay_27, flyback diode); its contact lights the yellow lamp LED.

## Observable behaviour
- Quiet: preamp at rest (second collector 4.84 V), relay out.
- A 1 kHz sound at 60 / 70 / 80 / 90 dB swings the second collector by 0.02 / 0.06 / 0.18 / 0.58 V: nothing happens.
- 100 dB (a clap): 1.68 V swing, the timer starts, the relay pulls in; one second later still in, three seconds later out.
- Light mode: dark, nothing; a torch (light 1): the relay pulls in.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10b.test.mjs`: swing 0.019 / 0.058 / 0.184 / 0.580 / 1.684 V at 60 / 70 / 80 / 90 / 100 dB.

## What this verifies
1. A loudspeaker is a microphone; two transistor stages lift its sub-millivolt signal by about a thousand (the swing grows 3.16× per 10 dB, as a linear amplifier's should).
2. The third NPN is a threshold: only peaks above about 0.6 V at its base pull the 555's trigger below 3 V, so it takes a clap, not speech.
3. The 555 monostable holds the relay for a fixed time however short the sound.

## Simulation notes
The coupling capacitors are small (1 µF, 100 nF) so the bias settles within a few tenths of a second; the reset delay covers that settling, which would otherwise fire the timer at switch-on. The learner's sound is a steady 1 kHz tone at the slider's level. Each millisecond of listening costs the solver about a second.

```assert
# switch-on: trigger high, reset held low by its delay, timer idle
net timer_555_21.trigger V 9.0 +-0.01
net timer_555_21.reset V 0.009 +-0.005
net timer_555_21.output V 0 +-0.01
net timer_555_21.control V 6.0 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@de8083c` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **17 of this page's 30** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-555-sound-switch` prints them one by one.
<!-- engine-provenance -->
