---
level: intermediate
age: 12+
prereqs: [pc88-lichtorgel, pc50-two-stage-rc]
teaches: [high-pass, low-pass, cutoff-frequency, filters]
---
## Was du siehst
Ein Signal, zwei LEDs: Rot für den Bass, Blau für die Höhen. Welche leuchtet, hängt davon ab, wie schnell das Signal schwingt.

## Probier das
1. Klick auf **Sim**. Bei 50 Hz glimmt die rote LED.
2. Erhöh die Frequenz des Funktionsgenerators schrittweise: 100 Hz, 300 Hz, 1000 Hz, 3000 Hz.
3. Wo wird Rot schwächer? Wo kommt Blau?
4. Setz Oszilloskop-Tastköpfe an die beiden Filterausgänge und vergleiche ihre Größe.

## Was passiert hier
Ein Kondensator lässt schnelle Änderungen durch und sperrt langsame. Im Höhenzweig muss das Signal durch einen Kondensator, also kommen nur hohe Töne zum Transistor. Im Basszweig schließt ein Kondensator das Signal nach Masse kurz — hohe Töne werden verschluckt, tiefe bleiben. Jedes gefilterte Signal steuert seinen eigenen Transistor mit LED. Mit Musik statt Sinus blitzen Trommeln rot und Becken blau.

## Weiter geht's
- [pc88-lichtorgel](../pc88-lichtorgel) — eine Lichtorgel, die nur auf Lautstärke reagiert.
- [pc50-two-stage-rc](../pc50-two-stage-rc) — RC-Filter vermessen.
