# UND, ODER und XOR im Vergleich

Dieselben zwei Schalter treiben gleichzeitig ein UND (74HC08), ein ODER (74HC32) und ein XOR (74HC86), jedes mit eigener LED. Gehe die vier Eingangskombinationen durch und lies drei Wahrheitstabellen nebeneinander. XOR ist der Sonderfall — es bedeutet „genau einer von beiden“ — und genau dieses Gatter addiert.

**Vermittelt:** drei Wahrheitstabellen an einem Eingangspaar vergleichen

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 2 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| A | B | AND | OR | XOR |
|---|---|---|---|---|
| 0 | 0 | off | off | off |
| 1 | 0 | off | ON | ON |
| 0 | 1 | off | ON | ON |
| 1 | 1 | ON | ON | off |

## Was du brauchst

| qty | part |
|---|---|
| 1 | 74HC08 Quad AND |
| 1 | 74HC32 Quad OR |
| 1 | 74HC86 Quad XOR |
| 1 | 4-way DIP Switch (SPST) |
| 1 | LED 2V, green |
| 1 | LED 2V, red |
| 1 | LED 2V, yellow |
| 2 | Resistor 10kΩ |
| 3 | Resistor 330Ω |

3 integrierte Schaltkreis(e), 2 Steckbrett(er), 5 V.
