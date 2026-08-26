# 4-Bit-Addierer auf einem Chip (74HC283)

Acht Schalter rein, fünf LEDs raus: ein kompletter 4-Bit-Addierer in einem 16-poligen Gehäuse. Darin steckt viermal der Volladdierer, den du gerade gebaut hast, Übertrag an Übertrag gekettet. Lies A auf der linken Schalterbank, B auf der rechten und die Antwort über den LEDs (die rote ist der Übertrag und zählt 16). Die Engine schreibt die Bitstellen a0..a3 — a0 ist das Einer-Bit.

**Vermittelt:** binäre Stellenwerte, Ripple-Carry, einen Bus lesen

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 2 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| A | B | Cout + SUM |
|---|---|---|
| 0000 | 0000 | 0 0000 |
| 0101 | 0011 | 0 1000 |
| 1111 | 0001 | 1 0000 |
| 1111 | 1111 | 1 1110 |
