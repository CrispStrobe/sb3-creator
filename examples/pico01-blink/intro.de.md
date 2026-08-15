---
level: beginner
age: 8+
prereqs: []
teaches: [raspberry-pi-pico, gpio, blink]
---
## Was du siehst
Eine LED an einem GPIO-Pin des Raspberry Pi Pico blinkt einmal pro Sekunde an und aus. Der Pico fuehrt dieselbe Blink-Logik wie andere Boards aus, aber auf einem ARM Cortex-M0+ Prozessor mit Doppelkern.

## Probier das
1. Starte das Programm und beobachte das LED-Blinken mit 1 Hz.
2. Aendere die Wartezeit auf 250 ms und beobachte das schnellere Blinken.
3. Wechsle die LED auf einen anderen GPIO-Pin und passe die Pin-Deklaration an.

## Was passiert hier
Der Raspberry Pi Pico verwendet den RP2040-Chip mit 26 GPIO-Pins und einem 133-MHz-Doppelkern-ARM-Prozessor. Das Blink-Programm setzt einen Pin auf high, wartet, setzt ihn auf low und wartet — dasselbe Muster wie bei jedem anderen Mikrocontroller. Der Pico arbeitet mit 3,3-V-Logikpegeln, nicht 5 V wie die Arduino-Boards, daher muessen LEDs und Peripherie mit 3,3 V kompatibel sein. Die eingebaute LED am Pico liegt auf GPIO 25 (Pico) oder ist direkt mit dem Wireless-Chip verbunden (Pico W).

## Warum das wichtig ist
Der Pico bringt moderne ARM-Rechenleistung zu sehr niedrigen Kosten. Er fuehrt MicroPython, C/C++ und jetzt Brickwright-Pseudocode aus. Mit Blink zu starten bestaetigt, dass das Board funktioniert, und legt die Grundlage fuer komplexere Projekte mit seinen Doppelkernen, PIO-Zustandsmaschinen und seinem reichhaltigen Peripherie-Angebot.

## Weiter geht's
- [pico02-pot-print](../pico02-pot-print) — einen Analogeingang am Pico lesen.
- [pico04-button](../pico04-button) — auf Tastendrucke reagieren.
- Experiment: Versuche, mit 1-ms-Intervallen zu blinken, und nutze ein Oszilloskop oder eine schnelle Kamera, um zu sehen, ob die LED tatsaechlich so schnell umschaltet — der Pico ist schnell genug dafuer.
