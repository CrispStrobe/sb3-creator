# Der Volladdierer (Übertrag rein, Übertrag raus)

Zwei XOR, zwei UND und ein ODER: A + B + ein hereinkommender Übertrag. Dieser dritte Eingang ist der ganze Punkt — er erlaubt es, Addierer zu verketten, wobei jeder seinen Übertrag an den nächsten weitergibt. Schließe alle drei Schalter: 1+1+1 = 11 binär, also leuchten SUMME und ÜBERTRAG gemeinsam.

**Vermittelt:** warum Addierer sich verketten: der Übertragseingang

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 2 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| A | B | Cin | SUM | CARRY |
|---|---|---|---|---|
| 0 | 0 | 0 | off | off |
| 1 | 0 | 0 | ON | off |
| 1 | 1 | 0 | off | ON |
| 1 | 1 | 1 | ON | ON |
