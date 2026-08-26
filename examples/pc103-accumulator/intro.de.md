# Der Akkumulator — eine Schaltung mit Vergangenheit

Ein 74LS173 hält eine laufende Summe, ein 74HC283 addiert den Schalterwert dazu, und die Summe geht direkt wieder in das Register. Jeder Taktimpuls addiert erneut: stell 1 ein und es zählt, stell 3 ein und es geht 3, 6, 9. Das ist die erste Schaltung hier, deren Antwort davon abhängt, was vorher war — und diese Rückkopplung, Register raus, durch Logik, ins Register zurück, ist die Form jedes Prozessors. MR setzt alles auf null.

**Vermittelt:** Register, Rückkopplung, Zustand der den Takt überdauert

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 2 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| action | total |
|---|---|
| +3, clock 1 | 3 |
| clock 2 | 6 |
| clock 3 | 9 |
| no clock | unchanged |
| MR | 0 |
