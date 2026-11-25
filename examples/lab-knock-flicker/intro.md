# Knock detector

**Teaches:** vibration pickup, amplifier, peak detector

## What to do

Click **Sim** and wait a moment: the LED is dark. Then turn up the pickup's Sound slider (earphone_3) to about 110 dB, as if you knocked hard on the table. Try a soft knock (80 dB) too.

## What you should see

- Hard knocks: the LED flashes with each knock.
- Soft knocks: nothing.

## Why it works

The crystal earphone turns the vibration of the table into a tiny voltage. The first transistor passes it on without loading the crystal, the second amplifies it about a hundred times, and two diodes turn the amplified burst into a short DC voltage on a capacitor. That voltage switches on the third transistor and the LED until the capacitor has drained again.
