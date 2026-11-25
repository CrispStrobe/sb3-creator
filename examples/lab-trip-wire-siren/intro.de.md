# Stolperdraht-Alarm mit Zweiton-Sirene

Ein dünner Draht quer durch eine Tür: Reißt er, heult eine Sirene, und sie heult weiter, auch wenn der Eindringling den Draht wieder einhängt. Nur eine versteckte Reset-Taste bringt sie zum Schweigen.

**Vermittelt:** Speicher-Flipflop, Entkopplung mit Diode, modulierter Ton

## Was zu tun ist

Klick auf **Sim**. Öffne den Schalter (der Draht reißt). Schließ ihn wieder. Drück dann die Taste (den versteckten Reset).

## Was du sehen solltest

- Scharf: Grün leuchtet, Stille.
- Draht gerissen: Rot leuchtet, und eine Sirene wechselt etwa viermal pro Sekunde die Tonhöhe.
- Draht wieder heil: Die Sirene heult weiter. Reset: wieder scharf und still.

## Warum es funktioniert

Reißt der Draht, zieht ein Widerstand die Setzleitung hoch, und eine Diode gibt das an das Flipflop weiter, das kippt und sich selbst hält. Ist der Draht wieder heil, zieht er die Setzleitung herunter, aber die Diode lässt ihn das Flipflop nicht zurückziehen. Das zweite Transistorpaar blinkt langsam und zieht jedes Mal am Kondensator des Tongenerators: zwei Tonhöhen.
