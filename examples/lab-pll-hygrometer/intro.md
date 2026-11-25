# Humidity made audible, and a hygrometer bridge

A comb of copper tracks under a thin film of salt is a humidity sensor: the moister the air, the better it conducts. Here it sets the pitch of a PLL chip's oscillator, so you can hear the humidity; flip a switch and the same sensor moves a meter instead.

**Teaches:** resistive humidity sensing, the voltage-controlled oscillator, bridges

## What to do

Click **Sim**. Use the humidity slider of the comb: dry room, normal room, breath. Then move the slide switch to the meter side and do the same.

## What you should see

- Tone: at 50 % almost nothing, at 60 % about 340 Hz, at 66 % about 1 kHz: breathing on it makes the tone shoot up.
- Meter: below zero in dry air, zero at about 62 %, above zero in moist air.

## Why it works

Dry salt does not conduct. In humid air the film takes up a little water, the salt's ions can move, and the resistance drops steeply. In the tone position the comb decides how much current charges the oscillator's capacitor: less resistance, more current, higher pitch. In the meter position it is one arm of a bridge, and the meter shows which way it is off balance.
