---
level: advanced
age: 14+
prereqs: [eater6502-bench]
teaches: [bus-contention, address-decode-debugging, chip-select]
---
## Was du siehst
Derselbe 6502-Computer im Ben-Eater-Stil wie **eater6502-bench** — aber mit einem absichtlichen Verdrahtungsfehler in der Adressdekodierung. Das Warnungen-Panel meldet sofort einen **Bus-Contention**-Fehler und benennt die kollidierende Adresse.

## Probier das
1. Öffne das Warnungen-Panel. Du siehst einen „bus contention at $2000"-Fehler — zwei Chips glauben beide, dass diese Adresse ihnen gehört.
2. Lies die Fehlermeldung: sie benennt, welche zwei Chips kollidieren und an welcher Adresse.
3. Finde den Bug: vergleiche die Verdrahtung der Gatter-Logik dieser Schaltung mit dem funktionierenden **eater6502-bench**. Eine Chip-Select-Leitung wurde von ihrer korrekten Quelle auf GND umgelegt.
4. Behebe ihn: verbinde VIA.CS2B wieder mit glue1.4y (dem Ausgang des NAND-Gatters) statt mit GND. Der Contention-Fehler sollte verschwinden.

## Was passiert hier
Der Chip-Select-Pin CS2B des VIA wurde auf Masse gelegt statt auf den Gatter-Ausgang, der ihn normalerweise steuert. Mit dauerhaft niedrigem CS2B antwortet der VIA immer wenn A13 hoch ist (CS1=A13) — auch im Adressbereich des RAM. Bei $2000 (wo A13=1 und das RAM ebenfalls ausgewählt ist) treiben beide Chips gleichzeitig den Datenbus. Auf echter Hardware ist das ein Kurzschluss zwischen zwei Ausgangstreibern.

Der Extraktor wertet die Select-Bedingung jedes Chips an allen 65536 Adressen aus und erkennt genau dies: zwei an einer Adresse ausgewählt = Contention, mit benannter Adresse.

## Warum das wichtig ist
Bus-Contention ist der häufigste und zerstörerischste Verdrahtungsfehler in busbasierten Computern. Er ist für das Auge unsichtbar (das Breadboard sieht in Ordnung aus), lautlos (keine Fehlermeldung von der CPU) und schädlich (kämpfende Chip-Ausgänge können den sicheren Strom überschreiten). Die Fähigkeit, eine Speicherkarte zu lesen und sich nicht überlappende Chip-Selects zu überprüfen, unterscheidet einen funktionierenden Computer von einem Haufen warmer Chips.

## Weiter geht's
- [eater6502-bench](../eater6502-bench) — dieselbe Schaltung, korrekt verdrahtet.
- Versuche, deinen EIGENEN Contention-Bug zu erzeugen: trenne ROM.CEB und lege es auf Masse. Was sagt der Extraktor jetzt?
