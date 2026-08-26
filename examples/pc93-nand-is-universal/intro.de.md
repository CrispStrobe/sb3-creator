# NAND genügt für alles

NICHT, UND und ODER, gebaut aus nichts als 74HC00-NAND-Gattern. Verbinde die beiden Eingänge eines NAND, und es invertiert; invertiere ein NAND, und es wird zum UND; verknüpfe zwei invertierte Eingänge mit NAND, und De Morgan schenkt dir das ODER. Ein einziger Gattertyp kann jeden anderen bauen — deshalb muss eine Chipfabrik nur in einer Sache gut sein.

**Vermittelt:** De Morgan, jedes Gatter aus einem Gattertyp bauen

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Alles sitzt auf einem Steckbrett.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| A | B | NOT A | A AND B | A OR B |
|---|---|---|---|---|
| 0 | 0 | ON | off | off |
| 1 | 0 | off | off | ON |
| 0 | 1 | ON | off | ON |
| 1 | 1 | off | ON | ON |

## Was du brauchst

| qty | part |
|---|---|
| 2 | 74HC00 Quad NAND |
| 1 | 4-way DIP Switch (SPST) |
| 1 | LED 2V, green |
| 1 | LED 2V, red |
| 1 | LED 2V, yellow |
| 2 | Resistor 10kΩ |
| 3 | Resistor 330Ω |

2 integrierte Schaltkreis(e), 1 Steckbrett(er), 5 V.
