---
level: beginner
age: 8+
prereqs: [01-blink]
teaches: [tone-output, buzzer, frequency]
---
## What you see
A buzzer connected to the MCU plays a two-tone siren, alternating between 440 Hz and 880 Hz. Each tone lasts half a second before switching, creating a classic alarm sound.

## Try this
1. Run the program and listen to the alternating high-low siren.
2. Change one frequency to 1000 Hz and hear how the siren character changes.
3. Make both tones the same frequency — the siren becomes a steady tone.

## What is going on
The MCU generates a square wave on the buzzer pin by toggling it at the right rate. For 440 Hz, the pin toggles every 1.136 ms (half the period of a 440 Hz wave). The `set BUZZER to 440 hz` instruction handles the timing. The buzzer contains a piezo element or a small speaker that vibrates at whatever frequency the square wave drives it. By alternating between two frequencies with a wait between them, the program creates a siren effect.

## Why it matters
Audible feedback is essential in embedded systems — alarms, notifications, user confirmations. Generating a tone from a digital pin is one of the simplest ways to add sound to a project, and understanding frequency as "toggles per second" connects code to physics.

## Go further
- [01-blink](../01-blink) — the same toggling concept but slow enough to see instead of hear.
- [05-counter-7seg](../05-counter-7seg) — add a beep each time the button is pressed.
- Experiment: create a three-tone alarm by adding a third frequency and cycling through all three.
