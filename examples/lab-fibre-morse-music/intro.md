# Morse and music over a light guide

Light can carry sound. A transistor makes an LED's brightness follow a signal, a light guide takes the light away, and at the far end a phototransistor and an amplifier chip turn it back into sound.

**Teaches:** light modulation, optical signal links, the two-transistor astable as a tone source

## What to do

Click **Sim**. Press the **button** in short and long bursts: that is your Morse key. Then move the **slide switch** to the music player and listen. Finally open the air gap at the end of the light guide with its slider.

## What you should see

- Key up: the LED glows steadily and the speaker is quiet.
- Key pressed: a tone of about 680 Hz, on for as long as you hold the key.
- Music: the speaker plays the 440 Hz tune.
- A wide air gap at the end of the guide: the music gets much quieter.

## Why it works

The transistor under the LED passes more current when its base voltage rises, so the LED gets brighter and darker in step with the signal. The tone from the astable switches it fully on and off; the music only makes it a little brighter and darker. The phototransistor's current follows the light it receives, and the LM386 amplifies those small changes for the speaker. Fibre-optic links in telephone and internet cables carry signals the same way, only much faster.
