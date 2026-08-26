# Zwei Ziffern: der Rechner, der bei neun nicht aufgibt

L7 blieb über 9 dunkel, weil ein BCD-Dekoder nur zehn Ziffern kennt. Das hier ist die richtige Lösung, und jeder Dezimaladdierer macht es so: verlässt die Summe den Dezimalbereich, ADDIERE SECHS und trage einen Zehner weiter. Drei Gatter erkennen den Überlauf (Cout, oder S3 mit S2, oder S3 mit S1), ein zweiter 74HC283 addiert die Sechs, und derselbe Übertrag lässt die Zehnerstelle leuchten. Stelle beide Bänke auf eine Dezimalziffer 0–9 und lies das Ergebnis, 0 bis 18.

**Vermittelt:** BCD-Korrektur (plus sechs), Dezimalübertrag, zwei Anzeigen ansteuern

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 4 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| A | B | display |
|---|---|---|
| 3 | 4 | 07 |
| 9 | 0 | 09 |
| 9 | 1 | 10 |
| 7 | 6 | 13 |
| 9 | 9 | 18 |
