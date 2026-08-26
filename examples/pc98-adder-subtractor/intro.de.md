# Subtraktion ist dieselbe Schaltung

Ein einziger zusätzlicher 74HC86 macht aus dem Addierer einen Addierer-Subtrahierer. Der Modus-Schalter geht gleichzeitig an die XOR-Bank UND an den Übertragseingang: offen rechnet die Schaltung A + B, geschlossen kippt jedes B-Bit und unten kommt eine 1 herein — das ist das Zweierkomplement. Die rote LED bedeutet jetzt „kein Borgen": sie leuchtet, wenn A größer oder gleich B ist.

**Vermittelt:** Zweierkomplement, XOR als steuerbarer Inverter, das Borge-Flag

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 3 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| mode | A | B | result |
|---|---|---|---|
| + | 7 | 2 | 9 |
| − | 7 | 2 | 5, carry lit (no borrow) |
| − | 2 | 7 | 11, carry dark (borrowed) |
| + | 15 | 1 | 0, carry lit |
