# Der Programmzähler — wohin die Maschine schaut

Ein 74LS161 zählt im Binärsystem von 0 bis 15, ein Schritt pro Takt. Dieses Register sagt, welcher Befehl als Nächstes kommt — ein Programm ist nichts anderes als diese Zahl, die hochläuft. Die rote LED ist der Übertrag (RCO), der bei 15 leuchtet und mit dem man Zähler zu breiteren verkettet. Clear und Load sind LOW-AKTIV und liegen deshalb auf High.

**Vermittelt:** Binärzählen, Low-aktive Steuerpins, Ripple-Carry

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 2 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| clocks | LEDs |
|---|---|
| 0 | 0000 |
| 1 | 0001 |
| 9 | 1001 |
| 15 | 1111 + RCO lit |
| 16 | wraps to 0000 |

## Was du brauchst

| qty | part |
|---|---|
| 1 | 74LS161 4-bit Counter |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 1 | LED 2V, red |
| 1 | Resistor 10kΩ |
| 5 | Resistor 330Ω |

1 integrierte Schaltkreis(e), 2 Steckbrett(er), 5 V.
