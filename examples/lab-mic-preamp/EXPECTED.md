# lab-mic-preamp — expected behaviour

## Circuit
- 9 V supply. A loudspeaker (`speaker_3`) is the microphone: it hears a voice at 80 dB SPL (`soundDb`, the **Voice** slider; a sustained vowel at 150 Hz with harmonics).
- 220 nF couples it into the preamp, an NPN (`npn_7`) in common emitter: 4.7 kΩ collector load, 470 kΩ from collector to base (collector-feedback bias), emitter grounded.
- 1 µF takes the collector signal to the top of a 10 kΩ volume pot (`potentiometer_9`, full as authored); the wiper feeds the LM386's +IN (`lm386_10`, gain 20).
- The LM386 drives a 2 kΩ magnetic earphone through 100 µF.

## Observable behaviour
- The preamp's collector settles at about 4.85 V within 15 ms of switch-on.
- With the voice: the collector swings about 77 mV peak to peak (from about 0.1 mV at the speaker), the amplifier output about 1.6 V peak to peak at full volume.
- Volume pot at 0.3: the output falls in proportion, to about 0.46 V peak to peak.

## Measured on the engine
bw-board f4aaec43, `test/lab-circuits-r7a.test.mjs`, 25 ms after switch-on, 10 ms windows.

## What this verifies
1. A one-transistor stage amplifies a microphone's signal by about a hundred times (gm·4.7 kΩ at about 0.9 mA).
2. A pot between two stages sets the level the second stage gets.

## Simulation notes
A speaker as microphone makes 0.5 mV/Pa (flat across the band). The voice is the engine's built-in sustained vowel.

```assert
# power-on: supply, the LM386's bias divider, the microphone at rest
net vsource_2.pos V 9.00 +-0.01
net lm386_10.bypass V 4.50 +-0.05
net speaker_3.a V 0.00 +-0.01
```

