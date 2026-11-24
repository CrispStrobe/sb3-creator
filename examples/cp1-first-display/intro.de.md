---
level: foundation
age: 10+
prereqs: []
teaches: [cp1-cells, cp1-accumulator, seven-segment-display]
---
## Eine Zahl zum Nachverfolgen

Dieses neu geschriebene Programm hat drei Zellen: `AKO 42` lädt eine Konstante, `ANZ` lässt die CP1-Firmware den Akkumulator anzeigen und `HLT` hält das Lernprogramm an. Der echte 8049 bedient weiterhin Monitor und Anzeige. Importiere vor dem Start ein eigenes kompatibles CP1-Monitor-ROM mit 2 KB. Dieses Beispiel enthält kein ROM.

## Ausprobieren

1. Vergleiche Quelle und Dezimallisting: `04.042`, `02.000`, `01.000`. Jede Zelle enthält ein Befehlsbyte und ein Operandenbyte. Der Punkt trennt beide Werte; er ist kein Dezimalzeichen.
2. Lade das Programm ins RAM. Wähle mit der PC-Taste des CP1-Monitors Zelle 0 und starte das Lernprogramm mit RUN. Die Ausführen-Schaltfläche des Arbeitsbereichs lässt den 8049 laufen; sie ersetzt nicht die RUN-Taste des Monitors.
3. Lies die sechs Segmentanzeigen ab, nachdem die Firmware sie angesteuert hat. Vergleiche den sichtbaren Wert mit 42. Lässt sich ein Muster nicht als Ziffer lesen, notiere das tatsächliche Muster, statt eine Zahl zu raten.
4. Ändere `VALUE` auf 73, lade erneut, wähle Zelle 0 und wiederhole den Versuch. Vergleiche die RAM-Zellen vor und nach der Änderung.

## Zwei verschiedene Schritte

CPU-Schritt führt einen echten 8049-Befehl aus. Die STEP-Taste der CP1-Tastatur fordert über das ROM einen Lernsprachbefehl an. Dafür können viele CPU-Befehle nötig sein. Bestätige den Lernschritt selbst, nachdem du den Vergleich durchgeführt hast. Das Öffnen einer Ansicht beweist noch kein Anzeigeergebnis.
