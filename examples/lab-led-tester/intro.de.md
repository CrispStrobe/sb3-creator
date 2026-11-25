# LED-Kreis-Prüfer: ein Ton für Unterbrechung, ein anderer für Kurzschluss

Ist die Kontroll-LED abgerissen, oder schließt sie etwas kurz? Dieser Prüfer sagt es dir übers Ohr: Stille, wenn alles stimmt, ein hoher Ton bei Unterbrechung, ein tiefer bei Kurzschluss.

**Vermittelt:** Fensterkomparator, Fehlersuche, einen Ton mit einer Spannung steuern

## Was zu tun ist

Klick auf **Sim**. Öffne den Schalter **BREAK** (die Leitung zur LED ist unterbrochen), schließ ihn wieder und schließ dann **SHORT** (etwas überbrückt die LED).

## Was du sehen solltest

- Alles in Ordnung: Die grüne LED leuchtet, Stille.
- BREAK: Die LED geht aus, ein höherer Ton erklingt.
- SHORT: Die LED geht aus, ein tieferer Ton erklingt.

## Warum es funktioniert

Der Prüfer schickt etwas Strom in den LED-Kreis und schaut auf die Spannung: etwa 1,8 V bei einer intakten LED, fast die vollen 9 V bei Unterbrechung, fast 0 V bei Kurzschluss. Zwei Operationsverstärker prüfen „zu hoch“ und „zu tief“. Jeder legt, wenn er anspricht, eine andere Spannung an die Basiswiderstände eines Transistor-Tongenerators: höhere Spannung, höherer Ton; keine Spannung, kein Ton.
