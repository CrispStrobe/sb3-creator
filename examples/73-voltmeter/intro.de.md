# Voltmeter

Der ADC liest den Messpin; das OLED zeigt Millivolt. Im SIM **ist**
das Potentiometer die Messspannung — Schleifer ziehen und die Anzeige
folgt, 0 bis 5000 mV. Die Rechnung ist die ganze Lektion:
`mV = Messwert × 5000 / 1023` — ein 10-Bit-ADC gegen 5 V Referenz.
