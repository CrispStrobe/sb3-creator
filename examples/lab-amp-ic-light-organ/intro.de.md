# Lichtorgel mit Leistungsverstärker

Ein Lautsprecher hört der Musik zu und arbeitet als Mikrofon. Ein LM386 verstärkt, was er aufnimmt, 200-fach, und ein Transistor lässt eine rote LED bei den lauten Stellen aufblitzen. Ein Schiebeschalter schaltet einen Transistor-Vorverstärker mit Empfindlichkeitsregler davor, dann reicht schon normale Musik.

**Vermittelt:** Lautsprecher als Mikrofon, Verstärkung, Transistor als LED-Treiber, Vorverstärker und Empfindlichkeit

## Was zu tun ist

Klick auf **Sim**. Schieb in der Instrumentenspalte den Regler **Schall** am Lautsprecher auf etwa 80 (Musik im Raum), dann auf 110 (sehr laut, direkt am Lautsprecher). Stell dann den Schiebeschalter auf den Vorverstärker, probier wieder 80 dB und dreh am Poti SENSITIVITY.

## Was du sehen solltest

- Ohne Vorverstärker: bei 80 dB nichts; die LED blitzt nur bei sehr lautem Schall.
- Mit Vorverstärker: Die LED flackert schon bei 80 dB; dreh das Poti zurück, und sie bleibt dunkel.

## Warum es funktioniert

Schall bewegt die Membran des Lautsprechers, und seine Spule erzeugt eine winzige Spannung, bei normaler Musik weit unter einem Millivolt. Der LM386 mit einem Kondensator an den Verstärkungsanschlüssen multipliziert sie mit 200. Kondensator und Diode vor dem LED-Transistor lassen nur die positiven Spitzen durch, und der Transistor braucht etwa 0,7 V zum Einschalten, also leuchtet die LED nur bei lauten Stellen. Die zusätzliche Transistorstufe verstärkt das Signal noch einmal vor dem LM386; das Poti bestimmt, wie viel davon ankommt.
