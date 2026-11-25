# Ein-Tasten-Ein/Aus-Schalter

Einmal berühren schaltet ein, nochmal berühren schaltet aus. Lässt du den Finger drauf, blinkt es.

**Vermittelt:** Flipflop, Kondensator als Speicher, Komparatoren des 555

## Was zu tun ist

Klick auf **Sim**. Tippe kurz auf BERÜHREN (button_9): die rote LED und das Relais (relay_13) schalten ein. Nochmal tippen: aus. Halte BERÜHREN dann ein paar Sekunden.

## Was du sehen solltest

- Jedes kurze Tippen schaltet LED und Relais um.
- Gedrückt gehalten: die LED blinkt, etwa eine halbe Sekunde an, etwa eine Zehntelsekunde aus.

## Warum es funktioniert

Der Eingang des 555 liegt genau zwischen seinen beiden Schaltspannungen, deshalb bleibt er, wie er ist. Ein Kondensator wird vom Ausgang geladen: voll, wenn der Ausgang an ist, leer, wenn er aus ist. Dein Finger verbindet den Kondensator mit dem Eingang. Ein voller Kondensator hebt den Eingang über die obere Schaltspannung, und der Ausgang geht aus; ein leerer zieht ihn unter die untere, und der Ausgang geht an. Bleibt dein Finger drauf, lädt oder leert sich der Kondensator auf den neuen Zustand und schaltet wieder um.
