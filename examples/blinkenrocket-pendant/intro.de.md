---
level: advanced
age: 14+
prereqs: [arduino-01-blink, arduino-05-for-loop]
teaches: [multiplexing, led-matrix, polarity, column-scanning, attiny88]
---
## Was du siehst
Ein Anhänger-Badge mit einem ATtiny88-Mikrocontroller, der eine 8×8-LED-Matrix (788AS) durch Spalten-Scanning ansteuert. Zwei Taster scrollen ein Smiley-Muster links und rechts. Das ist dieselbe Architektur wie der blinkenrocket-LED-Badge, von Grund auf mit unserer eigenen Firmware neu gebaut.

## Probier das
1. Starte das Programm — das Smiley-Muster erscheint auf der Matrix.
2. Drücke die Links-/Rechts-Taster, um das Muster zu scrollen.
3. **Die Polaritäts-Lektion:** Ändere die Matrix-Variante im Schaltplan von „788AS" zu „788BS". Jetzt leuchtet jede LED schwach statt ein Muster zu zeigen — weil die Spalten- und Zeilen-Polarität beide falsch sind. Die 788AS hat Spalten active LOW und Zeilen active HIGH; die 788BS hat das Gegenteil. Falsche Polarität bedeutet, dass jede LED einen schwachen Vorwärtsstrom über den falschen Pfad bekommt.

## Was passiert hier
Eine 8×8-Matrix hat 64 LEDs, aber nur 16 Pins (8 Spalten + 8 Zeilen). Um eine bestimmte LED zu leuchten, **wählt man ihre Spalte** und **treibt ihre Zeile** an. Der Trick: nur eine Spalte ist gleichzeitig aktiv, aber das schnelle Durchscannen aller 8 Spalten (>100 Hz) lässt sie alle gleichzeitig leuchtend erscheinen — das ist **Multiplexing**.

Für die 788AS-Variante: Spalte LOW wählt aus (Kathodenseite), Zeile HIGH leuchtet (Anodenseite). Die Firmware setzt alle Spalten auf HIGH (abgewählt), setzt das Zeilenmuster, dann zieht sie EINE Spalte auf LOW für 2 ms, bevor sie zur nächsten wechselt.

## Warum das wichtig ist
Multiplexing ist die Standardtechnik zum Ansteuern von LED-Anzeigen, Siebensegment-Ziffern und Tastaturen. Jedes Verkehrsschild, jede LED-Werbetafel und jeder Taschenrechner verwendet es. Zu verstehen, welcher Pin die Anode und welcher die Kathode ist (die AS/BS-Polarität), ist die erste Lektion.

## Weiter geht's
- Ändere die Musterdaten, um einen Buchstaben oder deine Initialen anzuzeigen.
- Füge ein drittes Muster hinzu und wechsle mit den Tastern durch.
- Probiere verschiedene Scan-Geschwindigkeiten: zu langsam und du siehst Flackern, zu schnell und die LEDs werden dunkel.
