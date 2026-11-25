# Whistle and the tone wails

A two-transistor astable sings a steady tone through a piezo. Its base resistors do not go to the battery but to a control point — and an amplifier IC, fed by a loudspeaker used as a microphone, pushes that point up and down with every sound. The pitch follows.

**Teaches:** frequency modulation of an astable, the loudspeaker as microphone

## What to do

Select the speaker-microphone and set its **sound** to silent, click **Sim** and listen. Then raise the sound level (speak or whistle into it — 110 dB is shouting right at it).

## What you should see

- Silent: a steady tone near 425 Hz, every period the same (2.34–2.35 ms).
- With sound: the tone wails and warbles; its periods spread from about 1.9 to 2.6 ms.

## Why it works

Each half of the astable's cycle lasts as long as a capacitor needs to recharge through a base resistor. The higher the voltage that resistor returns to, the faster it recharges and the higher the pitch. The amplified sound moves exactly that voltage, so the pitch moves with the sound.
