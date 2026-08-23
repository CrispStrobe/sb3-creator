---
level: advanced
age: 14+
prereqs: [arduino-01-blink, arduino-05-for-loop]
teaches: [multiplexing, led-matrix, polarity, column-scanning, attiny88]
---
## Was du siehst
Ein Anhänger-Badge mit einem ATtiny88-Mikrocontroller, der eine 8×8-LED-Matrix (788AS) durch Spalten-Scanning ansteuert. Es schlägt ein Herz: ein großes und ein kleines Bild wechseln sich etwa dreimal pro Sekunde ab. Zwei Taster verlangsamen den Schlag, solange sie gedrückt sind. Das ist dieselbe Architektur wie der blinkenrocket-LED-Badge, von Grund auf mit unserer eigenen Firmware neu gebaut.

## Probier das
1. Starte das Programm — ein Herz schlägt auf der Matrix, großes Bild, dann kleines.
2. Halte einen der Taster gedrückt und beobachte, wie der Schlag langsamer wird: jedes Bild bekommt 0,2 s Pause.
3. **Die Polaritäts-Lektion:** Setze im Schaltplan `colActiveHigh` der Matrix auf `true` und `rowActiveHigh` auf `false` — das ist die 788BS-Verdrahtung mit gemeinsamer Kathode. Jetzt leuchtet jede LED schwach statt ein Muster zu zeigen — weil die Spalten- und Zeilen-Polarität beide falsch sind. Die 788AS hat Spalten active LOW und Zeilen active HIGH; die 788BS hat das Gegenteil. Falsche Polarität bedeutet, dass jede LED einen schwachen Vorwärtsstrom über den falschen Pfad bekommt. Diese beiden Parameter liest die Engine; die Typenbezeichnung selbst ist kein simuliertes Feld.

## Was passiert hier
Eine 8×8-Matrix hat 64 LEDs, aber nur 16 Pins (8 Spalten + 8 Zeilen). Um eine bestimmte LED zu leuchten, **wählt man ihre Spalte** und **treibt ihre Zeile** an. Der Trick: nur eine Spalte ist gleichzeitig aktiv, aber das schnelle Durchscannen aller 8 Spalten (>100 Hz) lässt sie alle gleichzeitig leuchtend erscheinen — das ist **Multiplexing**.

Für die 788AS-Variante: Spalte LOW wählt aus (Kathodenseite), Zeile HIGH leuchtet (Anodenseite). Die Firmware setzt alle Spalten auf HIGH (abgewählt), setzt das Zeilenmuster, dann zieht sie EINE Spalte auf LOW für 2 ms, bevor sie zur nächsten wechselt.

## Warum das wichtig ist
Multiplexing ist die Standardtechnik zum Ansteuern von LED-Anzeigen, Siebensegment-Ziffern und Tastaturen. Jedes Verkehrsschild, jede LED-Werbetafel und jeder Taschenrechner verwendet es. Zu verstehen, welcher Pin die Anode und welcher die Kathode ist (die AS/BS-Polarität), ist die erste Lektion.

## Weiter geht's
- Ändere die Musterdaten, um einen Buchstaben oder deine Initialen anzuzeigen.
- Füge ein drittes Muster hinzu und wechsle mit den Tastern durch.
- Probiere verschiedene Scan-Geschwindigkeiten: zu langsam und du siehst Flackern, zu schnell und die LEDs werden dunkel.
