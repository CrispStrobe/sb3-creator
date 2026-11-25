# Op-amp meters: offset null and reverse protection

Two measuring amplifiers and what they need in practice. A ×10 stage on a high-resistance input shows a reading with nothing connected, and a pot nulls it. An ammeter amplifier gets a diode that protects its input when the circuit under test is connected backwards.

**Teaches:** input bias current, offset null, input protection

## What to do

Click **Sim**. Read the ×10 meter (voltmeter_16) with nothing connected, then turn ZERO (potentiometer_9) until it reads zero. Press PROBE (button_11). Then read the ammeter (voltmeter_26) and slide POLARITY (slide_switch_19) to the right.

## What you should see

- ×10 meter: about 0.41 V with nothing connected; zero after ZERO; about 0.49 V with PROBE.
- Ammeter: about 3.9 V (79 mA); with POLARITY reversed it just reads zero.

## Why it works

The op-amp's input transistors need a tiny current, about 45 nA; flowing through the 1 MΩ input resistor that makes 41 mV, and the stage amplifies it ten times. The ZERO pot sends an equal current the other way. On the ammeter, the germanium diode starts to conduct as soon as the input goes a fifth of a volt below ground, and the 10 kΩ limits what it has to carry.
