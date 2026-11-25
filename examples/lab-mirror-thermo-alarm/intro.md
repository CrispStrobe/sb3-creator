# Current mirror as a heat and frost alarm

Two identical transistors, one copying the other's current. Warm one of them, or cool the other, and the copy goes wrong — badly enough to switch on an alarm tone. Warm both, and nothing happens.

**Teaches:** transistor as thermometer, current mirror, drift cancellation

## What to do

Click **Sim**. In the instruments column, move the Temperature slider of Q2 (npn_5) to fingers (33), then to hot water (70) and back to room. Then cool Q1 (npn_4) to ice (0). Finally put both in hot water.

## What you should see

- Fingers: still quiet. Hot water: the alarm sounds after a moment.
- Q1 in ice: the alarm sounds too.
- Both hot: quiet.

## Why it works

A transistor at a given current needs about 2 mV less base voltage per degree warmer. Q1 sets the base voltage for both; if Q2 is warmer, that voltage is too much for it and its current grows by about 8 % per degree. Its collector voltage falls until it can no longer hold the alarm off. Only the temperature difference matters, so warming the whole circuit does nothing.
