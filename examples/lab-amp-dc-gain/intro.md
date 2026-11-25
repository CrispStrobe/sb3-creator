# DC gain of the amplifier chip

A few millivolts go in, a needle shows what comes out. Close one of the four switches across the chip's gain pins and the same input moves the needle further: the smaller the resistor, the higher the gain.

**Teaches:** voltage gain, gain-setting resistor, measuring a gain with a meter

## What to do

Click **Sim**. Read the input on the voltmeter (voltmeter_5) and the output on the meter (analog_meter_16). Close one switch at a time (switch_7: 1 kΩ, switch_9: 220 Ω, switch_11: 47 Ω, switch_13: a wire) and divide the meter reading by the input. Turn the INPUT knob (potentiometer_4) to zero and back.

## What you should see

- Input about 9.5 mV; meter about 0.19 V with all switches open: a gain of 20.
- About 0.38 V with 1 kΩ, 0.82 V with 220 Ω, 1.44 V with 47 Ω and 1.89 V with the wire: gains of about 40, 86, 151 and 198.
- With the knob at zero the meter reads zero.

## Why it works

Inside the chip, a resistor network between the output and the gain pins decides how much of the output is fed back. A resistor across pins 1 and 8 lowers the resistance at the bottom of that network, so less is fed back and the gain rises, up to 200 with a direct connection. The meter is connected to a half-supply point, because the output rests at half the supply when there is no input.
