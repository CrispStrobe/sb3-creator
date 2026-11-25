---
level: intermediate
age: 11+
prereqs: [cp1-cp4-relay-signals, cp1-cp5-binary]
teaches: [cp1-input, cp1-output, relay, isolated-load, interference-suppression]
---
## Acht entstörte Eingänge, acht Relaiskontakte

Diese Schaltung bildet alle acht Kanäle des Kosmos CP4 mit bearbeitbaren Bauteilen ab. Jeder Eingang hat einen Spannungsteiler, zwei Klemmdioden und einen Kondensator mit 100 nF. Jeder Ausgang steuert über einen Transistor eine Relaisspule mit Freilaufdiode. Ein eigener Kondensator mit 100 nF liegt parallel zum Schließerkontakt. Die acht ohmschen Lasten werden über diese Kontakte aus einer getrennten Batterie gespeist.

1. **Brickwright-Monitor verwenden** wählen und die CPU bis zur Bereitschaftsanzeige starten. Alle acht Relaiskontakte schließen, weil der Monitor Port 2 auf High setzt. Die CPU anhalten, die Programmzellen laden und ohne Reset weiterlaufen lassen. Am Tastenfeld **0, 0, 0, PC, RUN** eingeben. Bei offenen Anforderungsschaltern öffnen alle Kontakte.
2. Unter **Schaltungen → Instrumente → Schalter** die Schalter 1, 3, 5 und 7 schließen. Den Anzeigewert zuerst vorhersagen. Die Stellenwerte ergeben 85. Die Schalter wieder öffnen und mit 2, 4, 6 und 8 den Wert 170 prüfen. Die Klemmenbezeichnungen beginnen bei null. Schalter 8 liest P1.7 und steuert das Relais an P2.7.
3. Im **Code** das Byte von P1E 0 über die Zelle inputs bis zu SUB inputs verfolgen. Ein offener Schalter liefert High. Das Programm zieht das gelesene Byte von 255 ab, damit das Relais bei geschlossenem Schalter seine Last einschaltet.
4. Einen Kanal vergrößern und seine Versorgungen verfolgen. Am Eingang gegen Computermasse messen, im Lastkreis gegen den Minuspol der Lastbatterie. Der Relaiskontakt verbindet die Last mit ihrer getrennten Versorgung.

Die [CP4-Anleitung, Abschnitt IV](https://www.retrozone.ch/docs/cp1/CP4-Relais-Modul.pdf) zeigt Spannungsteiler, Klemmdioden, Treiber und Kontaktentstörung. Diese Schaltung verwendet 9 V für die Spulen, 5 V für die Lasten und allgemeine Relaismodelle. Ein geschlossener Kontakt versorgt seine 1,56-kΩ-Last mit rund 3,2 mA. Transformator und Gleichrichter, Kontaktprellen, Belastungsgrenzen und gemessene Störfestigkeit müssen an der Hardware geprüft werden.
