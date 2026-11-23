# lab-solar-cell — expected behaviour

## Circuit
- Three single solar cells, each with its own light setting (0 = dark, 1 = full sun), all at 0.5 to start.
- Cell 1: through an ammeter and a slide switch into a load (1 Ω plus a 100 Ω pot used as a variable resistor); a voltmeter across the cell. Switch to the left: no load, open circuit.
- Cell 2: in series between a bias divider (100 kΩ from +9 V, 5.6 kΩ to minus, 0.48 V unloaded) and an NPN's base. The NPN lights a green LED through 1 kΩ. The second slide switch can put the cell's minus side on ground instead of on the divider.
- Cell 3: straight into a small fan motor that needs some torque before it starts.

## Observable behaviour
- Half light, load pot in the middle (about 51 Ω): 0.567 V and 11.1 mA.
- Sweep the load at half light: the current hardly changes at low resistance (about 59 mA near a short), the voltage hardly changes at high resistance (0.572 V at 101 Ω). The power peaks in between, near 11 Ω (0.516 V at 46 mA, about 24 mW).
- Open circuit at half light: 0.576 V; at full light only 0.600 V. The voltage barely follows the light, the current follows it in proportion.
- Cell 2 on the bias: the base sits at 0.68 V and the LED is lit even at 2 % light; in the dark the base falls back to the divider's 0.48 V and the LED goes out. Cell 2 alone, on ground: even at full light the base only reaches 0.60 V and the LED stays dark.
- Cell 3: at 20 % light the fan stands still; at half light it turns.

```assert
# half light, authored load and bias
net solar_cell_3.pos V 0.567 +-0.01
net npn_13.base V 0.683 +-0.01
net slide_switch_10.com V 0.107 +-0.01
net led_15.cathode V 0.205 +-0.02
```
