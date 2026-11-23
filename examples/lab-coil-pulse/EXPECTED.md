# lab-coil-pulse — expected behaviour

## Circuit
- 9 V supply. A 100 µF electrolytic is kept charged through 1 kΩ. The DUMP button connects it to winding A of a coil pair (2.2 Ω stands for the wire).
- Winding B has four times the inductance of winding A (twice the turns) and shares no wire with side A. A diode from winding B fills a 10 µF capacitor, which drives an NPN through 100 kΩ; the NPN lights the red LED through 470 Ω.
- Tester: green LED with 1 kΩ from +9 V. The slide switch sends it through winding A of a second, identical coil pair to minus (left), or into winding B of that pair (right). A voltmeter sits from the far end of winding B back to minus.

## Observable behaviour
- Tester on the left: the green LED is lit, about 6.9 mA. A winding is just a piece of wire for steady current.
- Tester on the right: the green LED is dark. There is no path from winding B to winding A; the voltmeter shows the gap holding about 7 V.
- Press DUMP: the capacitor empties into winding A in a few milliseconds. The changing field induces a pulse of about 18 V in winding B, the diode catches it, and the red LED flashes at about 15 mA, then fades as the 10 µF drains into the base: about 6 mA one second after the press, about 2 mA after two.
- Keep holding DUMP: nothing more happens. The steady current from the 1 kΩ through winding A induces nothing.
- Release, wait a moment for the capacitor to recharge, press again: another flash.

```assert
# power-on: tester lit through winding A, flash LED dark
net vsource_2.pos V 9.00 +-0.01
net transformer_17.p1 V 0.00 +-0.01
net led_15.anode V 2.07 +-0.05
net npn_11.collector V 9.00 +-0.01
```
