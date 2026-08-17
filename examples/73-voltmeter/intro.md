# Voltmeter

The ADC reads the probe pin; the OLED shows millivolts. In SIM the
potentiometer **is** the voltage under test — drag the wiper and watch
the reading track it, 0 to 5000 mV. The math is the whole lesson:
`mV = reading × 5000 / 1023` — a 10-bit ADC against a 5 V reference.
