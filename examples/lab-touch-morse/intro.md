# Touch Morse key

A Morse key with no moving parts: touch two contacts and a tone sounds, lift your finger and it stops. The tiny current through your skin is enough, because two transistors multiply it.

**Teaches:** Darlington pair, touch switch, keying an oscillator

## What to do

Click **Sim**, then press and release the button (your fingertip on the touch contacts) in short and long bursts.

## What you should see

- Silence while untouched.
- A clear tone for exactly as long as you touch.

## Why it works

Through your skin flow only a few microamps. The first transistor amplifies them about a hundred times, the second another hundred times: plenty to pull down the line that keeps the 'kill' transistor switched on. With the kill transistor off, the amplifier is free to oscillate.
