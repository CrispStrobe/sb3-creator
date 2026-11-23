# lab-lamp-monitor — expected behaviour

## Circuit
- 9 V supply. The light switch feeds the lamp circuit; the bulb socket (a slide switch) either holds the bulb or leaves the circuit open, like a blown filament.
- The lamp is a 90 Ω bulb rated 9 V. Its current returns to ground through a 10 Ω sense resistor, so the sense voltage is the lamp current times 10 Ω.
- R2 = 18 kΩ and R3 = 1 kΩ divide the SWITCHED lamp supply down to a reference of about half the normal sense voltage.
- LM358 comparator: sense voltage on +, reference on −. The red fault LED and its 470 Ω hang from the switched lamp supply into the comparator output, so the LED can only light while the light is switched on and the output is pulled low.

## Observable behaviour

| light switch | bulb | sense voltage | comparator output | fault LED |
|---|---|---|---|---|
| on | fitted | 0.898 V | 7.50 V (high) | off |
| on | removed | 0 V | low | ON |
| off | either | 0 V | low | off (no supply for it) |

- Light on, bulb fitted (the authored state): the lamp draws 8.991 / 100.1 = 0.0898 A, about 90 mA, so the sense resistor shows 0.898 V against a reference of 8.991 x 1 / 19 = 0.473 V. The comparator output sits at its high limit, 7.50 V, and the fault LED has only about 1.5 V across it: dark.
- Bulb removed: no lamp current, the sense voltage drops to zero, the comparator output falls and the fault LED lights. Its current is set by the 470 Ω resistor and by the LM358 output, which cannot pull all the way down to 0 V while it sinks the LED current.
- Light switched off: the reference and the fault LED's supply both vanish, so a missing bulb is only reported while the lamp is supposed to be lit. The same wiring checks a brake light only while the pedal is pressed.

```assert
# light on, bulb fitted: about 90 mA through the 10 ohm shunt
net r_sense.a V 0.898 +-0.01
net r_top.b V 0.473 +-0.01
net u1.1_out V 7.50 +-0.05
net light_sw.a V 8.99 +-0.02
```
