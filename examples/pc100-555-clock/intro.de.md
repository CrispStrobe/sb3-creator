# Der Takt — eine Maschine braucht einen Herzschlag

Ein 555 als astabiler Multivibrator mit etwa 1 Hz und einer LED, damit man ihn sehen kann. Alles Weitere bewegt sich nur, wenn dieser Pin wechselt. Über den Kondensator wird es schneller oder langsamer: f = 1,44 / ((R1 + 2·R2)·C). Pin 5 (Control) braucht seine 10-nF-Abblockung — lässt man ihn offen, ist die Referenz undefiniert und der Timer kippt nie.

**Vermittelt:** 555-Astabil, RC-Zeitkonstante, warum ein Rechner einen Takt braucht

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Alles sitzt auf einem Steckbrett.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| setting | effect |
|---|---|
| ~1 Hz | LED blinks |
| bigger C | slower |
| smaller C | faster |

## Was du brauchst

| qty | part |
|---|---|
| 1 | 555 Timer |
| 1 | Capacitor 10nF |
| 1 | Capacitor 10uF |
| 1 | LED 2V, yellow |
| 1 | Resistor 330Ω |
| 1 | Resistor 6.8kΩ |
| 1 | Resistor 68kΩ |

1 integrierte Schaltkreis(e), 1 Steckbrett(er), 5 V.
