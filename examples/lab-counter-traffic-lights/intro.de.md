# Ampel aus einem Zähler

Rot, Rot-Gelb, Grün, Gelb, wieder Rot – die Folge einer Ampel, aus einem Taktgeber, einem Binärzähler und vier Transistoren.

**Vermittelt:** Binärzählen, Dekodieren mit Transistoren, Logik aus Einzelbauteilen

## Was zu tun ist

Klick auf **Sim** und beobachte die drei LEDs. Der Takt schaltet etwa zweimal pro Sekunde weiter.

## Was du sehen solltest

- Rot → Rot + Gelb → Grün → Gelb → Rot, etwa alle halbe Sekunde ein Schritt.

## Warum es funktioniert

Die beiden niedrigsten Ausgänge des Zählers zählen immer wieder 00, 01, 10, 11. Die Transistoren machen daraus die Lichter: Rot leuchtet, solange der zweite Ausgang Low ist, Gelb folgt dem ersten Ausgang, und Grün leuchtet, wenn der zweite Ausgang High und der erste Low ist – sonst sperrt ihn ein vierter Transistor.
