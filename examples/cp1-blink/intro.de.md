---
level: foundation
age: 11+
prereqs: [cp1-first-display]
teaches: [cp1-output, loops, timing]
---
## Einen wiederkehrenden Ausgang bauen

Dieses neu geschriebene Programm mit sieben Zellen schreibt eins auf Ausgangsleitung 1, fordert 200 ms Wartezeit an, schreibt null, wartet erneut und springt zurück. Der Selektor in `P2A 1` beginnt bei eins; der Schaltungsanschluss heißt `P2.0`. Ein Vorwiderstand und eine LED machen den Ausgang sichtbar.

Importiere ein eigenes kompatibles CP1-Monitor-ROM, lade das Programm ins RAM und starte es über den Monitor bei Zelle 0. Verfolge den tatsächlichen Portwert und die LED. Ausführen im Arbeitsbereich lässt den 8049 laufen; RUN auf der Tastatur startet das Lernprogramm über das ROM.

## Ausprobieren

1. Ordne die Quelle den Zellen `04.001`, `18.001`, `03.200`, `04.000`, `18.001`, `03.200`, `09.000` zu.
2. Sage voraus, welche Schreibzugriffe die LED leitend machen. Vergleiche dann P2.0 und LED bei laufendem Programm.
3. Ändere `WAIT` auf 100 und miss den Abstand gleichartiger Ausgangsflanken. Zwei angeforderte Wartezeiten ergeben 200 ms pro Schleife; die Arbeit der Firmware kommt hinzu. Bezeichne 200 ms deshalb nicht als exakt gemessene Periode.
4. Pausiere die CPU, während die LED leuchtet. Das Ausgangsregister sollte den letzten Pegel halten. Unterscheide einen gespeicherten Pegel von einem weiterlaufenden Programm.

Nutze eine gemessene Portflanke oder deine ausdrückliche Beobachtung zum Bestätigen eines Schritts. Aus dem Vorhandensein einer Schleife wird kein erfolgreiches Blinken abgeleitet.
