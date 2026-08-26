# Der Halbaddierer (XOR + UND)

Ein XOR und ein UND, und die Maschine kann ein Bit zu einem Bit addieren. SUMME ist das XOR (1+0 = 1, und 1+1 = 0, weil es übergetragen hat), ÜBERTRAG ist das UND. Schließe beide Schalter: SUMME wird dunkel und ÜBERTRAG leuchtet — das ist binär 1+1 = 10, über zwei LEDs gelesen. Er heißt HALB, weil er keinen Platz für einen hereinkommenden Übertrag hat.

**Vermittelt:** Binäraddition eines Bits, Summe und Übertrag

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Alles sitzt auf einem Steckbrett.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| A | B | SUM | CARRY |
|---|---|---|---|
| 0 | 0 | off | off |
| 1 | 0 | ON | off |
| 0 | 1 | ON | off |
| 1 | 1 | off | ON |
