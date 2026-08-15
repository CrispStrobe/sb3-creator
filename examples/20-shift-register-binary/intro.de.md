---
level: intermediate
age: 12+
prereqs: [08-led-chaser-595]
teaches: [binary-counting, shift-register, digital-display]
---
## Was du siehst
Acht LEDs an einem 74HC595-Schieberegister zählen binär hoch. Das Muster beginnt bei 00000000 (alle aus), geht zu 00000001 (eine LED rechts an), 00000010, 00000011 und so weiter bis 11111111 (alle acht an), dann springt es zurück auf null.

## Probier das
1. Starte das Programm und beobachte die Binärzählung — die rechte LED wechselt bei jedem Schritt, die linke nur alle 128 Schritte.
2. Verlangsame das Zählintervall, damit du jede Bitänderung verfolgen kannst.
3. Starte die Zählung bei einer bestimmten Zahl, zum Beispiel 170 (binär 10101010), und beobachte das abwechselnde Muster.

## Was passiert hier
Der MCU sendet eine 8-Bit-Zahl an das 74HC595-Schieberegister über drei Signale: Daten, Takt und Latch. Jedes Bit der Zahl steuert eine LED. Eine Zählervariable wird bei jedem Zyklus erhöht, und ihre Binärdarstellung ist das, was die LEDs anzeigen. Das Schieberegister wandelt einen seriellen Bitstrom in acht parallele Ausgänge um — der MCU braucht also nur drei Pins, um acht LEDs zu steuern. Die Binärzählung macht den Zusammenhang zwischen Zahlen und Bitmustern physisch sichtbar.

## Warum das wichtig ist
Binär ist die Art, wie Computer jede Zahl, jeden Buchstaben und jeden Befehl speichern und verarbeiten. Einem physischen Binärzähler zuzuschauen, macht das abstrakte Konzept greifbar. Das Schieberegister selbst ist ein fundamentaler Baustein — so bewegen Computer Daten zwischen Komponenten, und es ist die Grundlage serieller Kommunikation.

## Weiter geht's
- [08-led-chaser-595](../08-led-chaser-595) — das einfachere Schieberegister-Projekt mit einer einzelnen wandernden LED.
- [18-logic-and-gate](../18-logic-and-gate) — Logikgatter, die Bausteine, die Binärarithmetik ermöglichen.
- Experiment: Zähle statt um 1 um 3 hoch und beobachte die weniger intuitiven Bitmuster.
