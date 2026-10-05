---
level: intermediate
age: 11+
prereqs: [01-blink, sense-thermometer-1wire]
teaches: [buses, time, events]
---
## Was du siehst
Der serielle Monitor zeigt die Uhrzeit, eine Zeile pro Sekunde: 23:59:50, 23:59:51 … und dann, um Mitternacht, 0:0:0. Die Lampe blinkt im Sekundentakt mit.

## Probier das
1. Ändere die Startzeit in `set time of clock to 23 : 59 : 50`. Schaffst du es, dass die Uhr von 9:59:59 auf 10:0:0 springt?
2. Uhren zeigen meist 08:05 statt 8:5. Füge ein WENN hinzu, das eine zusätzliche „0“ ausgibt, wenn die Minute kleiner als 10 ist.
3. Lass die Lampe nur in der ersten Sekunde jeder Minute leuchten.

## Was dahintersteckt
Die Uhr ist ein eigener Chip, ein DS3231, mit einem eigenen Quarz. Er zählt Sekunden, Minuten, Stunden, Tage, Monate und Jahre ganz allein — das Programm muss nur fragen. `current hour`, `current minute` und `current second` sind dieselben Scratch-Blöcke, die die Uhr des Computers lesen; auf einem Chip lesen sie den DS3231.

Die beiden sprechen über I2C: zwei Leitungen, SDA für die Daten und SCL für die Taktimpulse. Das Programm zieht die Leitungen auf LOW oder lässt sie los, und Widerstände ziehen sie wieder hoch. Jeder Chip am Bus hat eine Adresse — der DS3231 hat 0x68 —, deshalb können sich mehrere Chips dieselben zwei Leitungen teilen.

`set time of clock to …` schreibt die Uhrzeit einmal in den Chip. Danach liest das Programm nur noch; der Chip zählt weiter, auch während das Programm wartet, und auf einer echten Platine hält eine Knopfzelle ihn auch ohne Strom am Laufen.

## Warum das wichtig ist
Wecker, Datenlogger, Heizungsschaltuhren und Parkuhren müssen die Uhrzeit kennen, ohne dass man sie jede Minute neu stellt. Ein eigener Uhrenchip ist die Art, wie kleine Geräte die Zeit behalten.

## Weiter geht's
- [eeprom-start-counter](../eeprom-start-counter) — ein weiterer Chip an denselben zwei Leitungen, einer, der sich etwas merkt.
- [i2c-scanner](../i2c-scanner) — finde heraus, wer am Bus hängt.
- Experiment: Schalte die Lampe zu einer bestimmten Uhrzeit ein, wie ein Wecker.
