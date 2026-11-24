---
level: advanced
age: 14+
prereqs: [lab-counter-timer, lab-ir-beam-alarm]
teaches: [light-barrier, pulsed-light, counting, decoding, relay]
---
## Was du siehst
Ein 555 lässt eine Infrarot-LED tausendmal pro Sekunde aufblitzen. Auf der anderen Seite lauscht ein Empfänger auf diese Blitze, ein Zähler mit drei LEDs zählt jede Unterbrechung, und nach sechs zieht ein Relais an und eine grüne Lampe leuchtet.

## Probier das
1. Klick auf **Sim** und warte kurz. Schieb den Regler `blocked` am Lichtweg auf 1 und zurück: Der Zähler zeigt 1.
2. Mach das noch fünfmal. Bei 6 zieht das Relais an und die Lampe leuchtet.
3. Unterbrich weiter: Der Zähler bleibt bei 6.
4. Drück Reset: Alles beginnt von vorn.

## Was passiert hier
Der Empfänger misst nicht einfach die Helligkeit: Ein Kondensator und zwei Dioden lassen nur wechselndes Licht durch, also laden nur die Blitze des Senders das Signal auf, das den ersten Transistor eingeschaltet hält. Eine schwache Lampe auf dem Fototransistor ist gleichmäßiges Licht und bewirkt nichts; helles Licht würde ihn blenden. Unterbricht etwas den Strahl, hören die Blitze auf, der Ausgang des zweiten Transistors fällt, und der Zähler zählt weiter. Zwei Dioden beobachten zwei Zählerausgänge; nur bei binär 110 (sechs) sind beide hoch, und das Relais zieht an. Ein Kontakt schaltet die Lampe, der andere trennt den Takt vom Zähler, sodass er bei sechs stehen bleibt, bis du zurücksetzt.

## Weiter geht's
- [lab-ir-beam-alarm](../lab-ir-beam-alarm) — ein ständiger Strahl, der beim Unterbrechen Alarm gibt.
- [lab-counter-timer](../lab-counter-timer) — ein Zähler, der seinen eigenen Takt anhält.
