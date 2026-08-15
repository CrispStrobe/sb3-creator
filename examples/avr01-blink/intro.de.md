---
level: beginner
age: 8+
prereqs: []
teaches: [arduino-uno, gpio, blink]
---
## Was du siehst
Ein Arduino Uno lässt eine LED an Pin D13 mit 1 Hz blinken — eine halbe Sekunde an, eine halbe Sekunde aus. Das ist das universelle erste Programm für jedes Arduino-Board.

## Probier das
1. Klick auf **Sim** und beobachte, wie die LED blinkt.
2. Ändere die Wartezeit von 0,5 auf 0,1 Sekunden und sieh, wie die LED fünfmal schneller blinkt.
3. Setze sie auf 2 Sekunden und bemerke, wie langsam das Blinken wirkt, wenn man darauf achtet.

## Was passiert hier
Das Programm führt eine Endlosschleife aus, die den digitalen Pin D13 zwischen High und Low umschaltet. Wenn D13 auf High geht, fließt Strom durch den 220-Ω-Widerstand und die LED nach Masse und bringt sie zum Leuchten. Der Arduino Uno läuft mit einem ATmega328P bei 16 MHz — weit mehr Leistung als ein Blinken braucht, aber derselbe Chip, der auch komplexe Projekte antreibt.

## Warum das wichtig ist
Blink ist das „Hello, World!" der Hardware. Wenn die LED blinkt, weißt du, dass das Board funktioniert, die Toolchain funktioniert und du Code hochladen kannst. Jedes Arduino-Projekt beginnt hier.

## Weiter geht's
- [avr03-dual-blink](../avr03-dual-blink) — zwei LEDs blinken mit unterschiedlichen Geschwindigkeiten.
- [01-blink](../01-blink) — dasselbe Programm auf einem STC12-Mikrocontroller.
- Experiment: Füge eine zweite LED an D12 hinzu und lass sie abwechselnd mit D13 blinken.
