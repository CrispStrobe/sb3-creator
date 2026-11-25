# A flip-flop by hand, then by itself

Fill a capacitor with one button and empty it with another: an op-amp Schmitt trigger flips each time the capacitor passes one of its two thresholds. Then let the op-amp do the filling and emptying itself.

**Teaches:** Schmitt trigger thresholds, RC charging, the astable

## What to do

Click **Sim**. Hold CHARGE (button_7) and watch the capacitor's meter (voltmeter_18) and the LEDs. Let go, then hold DRAIN (button_9). Finally close AUTO (switch_12).

## What you should see

- CHARGE: the meter climbs; at about 5.5 V the green LED goes out and the red one lights. It stays that way when you let go.
- DRAIN: the meter falls; at about 3 V it switches back to green.
- AUTO: it blinks on its own, about once every one and a half seconds.

## Why it works

The op-amp compares the capacitor with a voltage that its own output moves: 5.5 V while green, 3 V while red. So it does not flip back the moment the capacitor wobbles; it waits for the other threshold. With AUTO the output itself charges the capacitor towards the threshold that will flip it again.
