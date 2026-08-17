# Ammeter

Real ammeters measure current the only way physics allows: the current
flows through a small **shunt resistor** and the meter reads the
voltage across it — Ohm's law does the rest, `I = V / R`. Here the
shunt is 10 Ω, the potentiometer is the variable load: drag it and the
milliamps change on the I²C character LCD. Why 10 Ω and not 0.1 Ω like
a real meter? So the ADC has something to read at breadboard currents —
and that trade-off (burden voltage) is itself the lesson.
