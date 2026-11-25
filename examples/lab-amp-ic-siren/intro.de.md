# Zweiton-Sirene mit Blinklicht

Zwei Transistoren lassen eine rote und eine blaue LED abwechselnd blinken. Ein Leistungsverstärker erzeugt den Ton. Über eine Diode und ein Poti speist ein Transistor zusätzlichen Strom in den Zeitkondensator des Tonoszillators, solange er gesperrt ist: Der Ton springt mit dem roten Licht eine Oktave hoch und mit dem blauen wieder herunter.

**Vermittelt:** ein Oszillator moduliert einen anderen, eine Diode als Einbahnstraße, der Ladestrom bestimmt die Tonhöhe

## Was zu tun ist

Klick auf **Sim**, beobachte die LEDs und hör zu. Dreh am Poti, um den hohen Ton zu verändern.

## Was du sehen solltest

- Rot und Blau wechseln sich ab, je etwa eine halbe Sekunde.
- Etwa 1,9 kHz, solange Rot leuchtet, etwa 940 Hz, solange Blau leuchtet.
- Weniger Widerstand am Poti: ein höherer hoher Ton.

## Warum es funktioniert

Der Ton des Verstärkers hängt davon ab, wie schnell sich sein Zeitkondensator lädt. Solange der zweite Transistor sperrt, ist sein Kollektor hoch, und zusätzlich fließt Strom durch die Diode und das Poti in den Kondensator: Er lädt schneller, der Ton ist höher. Leitet dieser Transistor, liegt sein Kollektor nahe 0 V, und die Diode sperrt.
