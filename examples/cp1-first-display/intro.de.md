---
level: foundation
age: 10+
prereqs: []
teaches: [cp1-cells, cp1-accumulator, seven-segment-display]
---
## Eine Zahl zum Nachverfolgen

Dieses neu geschriebene Programm hat drei Zellen: `AKO 42` lädt eine Konstante, `ANZ` lässt die CP1-Firmware den Akkumulator anzeigen und `SPU display` springt zum Anzeigebefehl zurück. Die Wiederholung hält das Ergebnis sichtbar. Wähle im Debugger oder in Widgets **Brickwright-Monitor verwenden**. Du kannst auch ein kompatibles Monitor-ROM mit 2 KB importieren.

## Ausprobieren

1. Vergleiche Quelle und Dezimallisting: `04.042`, `02.000`, `09.001`. Jede Zelle enthält ein Befehlsbyte und ein Operandenbyte. Der Punkt trennt beide Werte; er ist kein Dezimalzeichen.
2. Lass nach der Monitorauswahl die CPU mit „CPU ausführen“ bis zur stabilen Bereitschaftsanzeige des Monitors laufen. Pausiere die CPU, lade die Zellen und setze die CPU ohne Zurücksetzen fort. Wähle auf der CP1-Tastatur mit PC die Zelle 0 und starte das Lernprogramm mit RUN.
3. Lies die sechs Segmentanzeigen ab, nachdem die Firmware sie angesteuert hat. Vergleiche den sichtbaren Wert mit 42. Lässt sich ein Muster nicht als Ziffer lesen, notiere das tatsächliche Muster, statt eine Zahl zu raten.
4. Halte die Schleife mit STP auf der Tastatur an und pausiere die CPU. Ändere `VALUE` auf 73, lade erneut und setze die CPU ohne Zurücksetzen fort. Wähle dann mit PC auf der Tastatur Zelle 0 und drücke RUN. Vergleiche die RAM-Zellen vor und nach der Änderung.

## Weshalb die Anzeige wiederholen?

Das geprüfte 2716-Monitor-ROM wechselt zur Programmpositionsmeldung, wenn direkt nach ANZ ein HLT folgt: Es zeigt `P003`, statt 42 beizubehalten. Die Schleife schafft einen stabilen Beobachtungspunkt für den Akkumulator. Ersetze zum Vergleichen die dritte Zelle durch HLT, beobachte die Monitormeldung und stelle anschließend die Schleife wieder her.

## Zwei verschiedene Schritte

CPU-Schritt führt einen echten 8049-Befehl aus. Die STEP-Taste der CP1-Tastatur fordert über das ROM einen Lernsprachbefehl an. Dafür können viele CPU-Befehle nötig sein. Bestätige den Lernschritt selbst, nachdem du den Vergleich durchgeführt hast. Das Öffnen einer Ansicht beweist noch kein Anzeigeergebnis.
