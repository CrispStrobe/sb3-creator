# MOSFET regenerative receiver

The regenerative receiver again, with an n-channel MOSFET in place of the transistor. A MOSFET's gate draws no current, so there is no grid-leak detection here: the gate sits at the voltage the knob sets, and the channel itself detects. Its current goes with the square of the gate voltage above the threshold, so an RF swing on the gate raises the average current, and with an AM station that average carries the programme. A small winding in the drain feeds part of the tank's signal back: the knob sets how much the MOSFET amplifies and so how strongly it regenerates.

**Teaches:** MOSFET threshold voltage, square-law detection, regeneration (positive feedback) up to oscillation

## What to do

Click **Sim** and listen with the knob at 0.80. Turn it slowly to 0.77, then to 0.75, then on to 0.72. Measure the gate voltage and the top of the tuned circuit.

## What you should see

- At 0.80 the gate is below the threshold (about 1.8 V against 2 V): no drain current, silence.
- At 0.77 a little current flows and the station's 400 Hz tone is in the earphone, quietly: the channel's square law detects it.
- Just past that (0.75) the stage starts to oscillate with the station's carrier and you hear a high whistle: the beat between the station and the stage's own oscillation.
- Further on the gain passes the losses of the tuned circuit by far and it oscillates hard: the RF on the tank jumps to volts.

## Why it works

Below the threshold the channel is shut; above it the drain current rises with the square of the excess gate voltage. A square law turns an RF swing into extra average current — detection without a diode. The feedback winding in the drain puts some of the amplified RF back into the tank, which makes up part of the tank's losses: the station gets louder and the tuning sharper, until, past a certain gate voltage, the feedback wins and the stage oscillates on its own.
