# A MOSFET RF stage ahead of the detector

A receiver with a tuned circuit, a MOSFET that amplifies the radio frequency itself, a diode detector, a transistor audio stage and a loudspeaker amplifier. Two stations are on the air: a local one at 700 kHz and a neighbour at 740 kHz. A slide switch connects the antenna either straight to the tuned circuit or through a tiny 4.7 pF capacitor.

**Teaches:** RF amplification before detection, loose vs tight antenna coupling, selectivity

## What to do

Click **Sim** and listen: the local station's 400 Hz tone. Then flip the **slide switch** to the second position and turn the **tuning capacitor** to about 0.40 to find the station again.

## What you should see

- Straight coupling: loud; the MOSFET makes the RF about 15 times bigger before the diode sees it.
- Through 4.7 pF: much quieter (about a ninth of the RF), but the tuning is sharper — the neighbour station is held further down.
- The tuning moves a little with the coupling: the antenna's own capacitance belongs to the tuned circuit when it is connected straight.

## Why it works

A diode needs a few tenths of a volt before it detects well; a weak station gives far less. Amplifying the RF first puts the diode in its comfortable range. The antenna is a load on the tuned circuit: connected straight it damps it, so the resonance is broad; through a small capacitor it takes little energy out, the circuit stays sharp, but also less of the station gets in.
