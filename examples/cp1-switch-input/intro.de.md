---
level: foundation
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-input, binary-input, polling]
---
## Ein Taster bestimmt den Wert

Dieses neu geschriebene Programm liest mit `P1E 1` wiederholt Eingangsleitung 1, zeigt das Ergebnis mit `ANZ`, wartet mit `VZG 100` und springt zu `sample` zurück. CP1-Operanden zählen Leitungen ab 1; der entsprechende Schaltungsanschluss heißt `P1.0`. Operand 0 würde den ganzen Port lesen.

Importiere ein eigenes kompatibles Monitor-ROM und lass die CPU mit „CPU ausführen“ bis zur stabilen Bereitschaftsanzeige laufen. Pausiere die CPU, lade die Zellen und setze die CPU ohne Zurücksetzen fort. Wähle auf der CP1-Tastatur mit PC die Zelle 0 und drücke RUN zum Start des Lernprogramms.

Die Schaltung hat einen Pull-up-Widerstand und einen Taster nach Masse: losgelassen wird ein hoher Pegel erwartet, gedrückt ein niedriger. Vergleiche diesen elektrischen Pegel mit der Anzeige, statt „gedrückt“ immer mit eins gleichzusetzen.

## Ausprobieren

1. Sage das Eingangsbit für den losgelassenen und den gedrückten Taster voraus. Prüfe dann `P1.0` in der Portansicht.
2. Halte den Taster bei laufendem Programm. Vergleiche Portwert und Anzeige. Das Programm liest wiederholt; es empfängt kein Tasterereignis aus der Hostsprache.
3. Halte mit STP auf der Tastatur an, pausiere die CPU und ändere `VZG 100` auf `VZG 250`. Lade erneut, setze ohne Zurücksetzen fort und wähle PC 0/RUN auf der Tastatur. Vergleiche, wie schnell die Anzeige einem kurzen Druck folgt. Der Operand ist die gewünschte Verzögerung in Millisekunden; Ausführung und Anzeigescanning benötigen zusätzlich CPU-Zeit.
4. Pausiere die CPU und ändere den Eingang. Beobachte, dass RAM und Anzeigeverlauf erst beim Fortsetzen der CPU weiterlaufen.

Bestätige den gemessenen Zusammenhang selbst. Ein Klick auf den Eingang gilt nicht automatisch als Nachweis.
