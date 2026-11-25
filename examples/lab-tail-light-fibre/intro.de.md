# Rücklichtkontrolle: ein Ton, wenn die Lampe dunkel wird

Im Auto sind die Rücklichter hinter dir, du siehst also nicht, wenn eines ausfällt. Ein Lichtleiter bringt ihr Licht zum Armaturenbrett; solange es leuchtet, ist alles still. Fällt die Lampe aus, ertönt ein Warnton.

**Vermittelt:** Lampenüberwachung, Lichtleiter, einen Oszillator freigeben

## Was zu tun ist

Klick auf **Sim**. Schließ den Lichtschalter. Stell dann den Schiebeschalter auf „defekt“.

## Was du sehen solltest

- Licht an, Lampe in Ordnung: Die Lampe leuchtet, der Lautsprecher ist still.
- Lampe defekt: ein Warnton von etwa 410 Hz.
- Licht aus: alles ruhig.

## Warum es funktioniert

Das Licht der Lampe macht den Fototransistor leitend, und er schaltet einen Transistor ein, der den Zeitkondensator des LM386-Oszillators kurzschließt, so dass er nicht schwingen kann. Ohne Licht lässt der Transistor los, und der Oszillator läuft. Weil das Licht selbst geprüft wird, meldet die Warnung auch eine verschmutzte oder kaputte Lampe, nicht nur einen gerissenen Draht.
