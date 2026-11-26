## KIM-1: Schalter und LEDs

Drücke **GO** am KIM-1 im Controller. Betätige **PB0**, **PB1**, **PB2** oder **PB3** unter Schalter. Die passende LED an **PA0–PA3** folgt dem Schalter über ein Programm auf dem NMOS 6502.

Das Programm schaltet Port A auf Ausgabe, liest Port B und schreibt dessen Wert auf Port A. Widerstände, LEDs und Leitungen gehören zur simulierten Schaltung. Zum Beobachten läuft der Lerntakt mit 1000 Hz.

**ST** hält die CPU an. Aktiviere **SST** und drücke **GO**, um jeweils einen Befehl auszuführen. **AD** wählt eine Adresse, **DA** ändert ihr Byte, **+** geht weiter und **PC** zeigt den angehaltenen Programmzähler. **RS** setzt die Bedienung zurück und erhält den RAM.

Unter **Code → KIM-1** kannst du das Programm bearbeiten. Das Programm und Tastatureingaben werden mit der Schaltung gespeichert. Der Hardwaremonitor steht unter **Debugger → Firmware und TTY** bereit. Unter **Erweiterung und Speicher** lassen sich Module und Medien laden.
