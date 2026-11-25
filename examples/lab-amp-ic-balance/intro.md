# Red-green balance with an amplifier

One LED from the amplifier's output to ground, a second from the battery to the output. When the output is high, the first lights; when it is low, the second. A pot sets the output through the amplifier, so one knob slides the light from green to red. A slide switch adds a large capacitor in front of the amplifier: then the light lags behind the knob.

**Teaches:** an amplifier output that sources and sinks current, balance control, an RC delay

## What to do

Click **Sim**. Turn the pot from one end to the other and watch the light move from green to red. Then flip the slide switch (lag on) and turn the pot quickly again.

## What you should see

- Pot at one end: green only. Other end: red only. Middle: both glow.
- With the lag on, the light follows a quick turn of the pot slowly, taking about two seconds to arrive.

## Why it works

The amplifier copies the pot's voltage to its output. A high output pushes current down through the red LED; a low output pulls current through the green one from the battery. With the switch on, the capacitor on the amplifier's input has to charge through a resistor first, so the input, and with it the light, changes gradually.
