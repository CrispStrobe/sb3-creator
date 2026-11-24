---
level: intermediate
age: 12+
prereqs: [lab-counter-timer, sense-light-barrier]
teaches: [light-barrier, counting, decoding, relay]
---
## Was du siehst
Eine Infrarot-Lichtschranke, ein Zähler mit drei LEDs und ein Relais mit einer grünen Lampe. Der Schieber am Lichtweg spielt den Gegenstand, der durch den Strahl geht.

## Probier das
1. Klick auf **Sim**. Schieb den Regler `blocked` am Lichtweg auf 1 und zurück auf 0: Der Zähler zeigt 1.
2. Mach das noch fünfmal. Bei 6 zieht das Relais an und die grüne Lampe leuchtet.
3. Unterbrich weiter: Der Zähler bleibt bei 6.
4. Drück den Reset-Taster: Zähler und Relais fangen von vorn an.
5. Schieb den Regler nur zur Hälfte: Das zählt nicht.

## Was passiert hier
Der Fototransistor leitet, solange er den Infrarotstrahl sieht. Wird der Strahl unterbrochen, fällt seine Ausgangsspannung, und dieser Abfall ist ein Taktimpuls für den Zähler. Zwei Dioden beobachten zwei Zählerausgänge: Nur wenn beide hoch sind (binär 110, also 6), kann ihr Verbindungspunkt ansteigen und den Transistor einschalten, der das Relais betätigt. Ein Kontaktsatz des Relais schaltet die Lampe, der andere trennt den Takt vom Zähler, sodass bis zum Reset nichts mehr gezählt wird. Solche Zähler zählen Besucher an einer Tür oder Teile auf einem Förderband und halten das Band an, wenn eine Kiste voll ist.

## Weiter geht's
- [lab-ir-remote-toggle](../lab-ir-remote-toggle) — Infrarotblitze schalten ein Relais um.
- [lab-counter-timer](../lab-counter-timer) — ein Zähler, der seinen eigenen Takt anhält.
