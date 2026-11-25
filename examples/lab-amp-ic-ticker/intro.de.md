# Tickender Doppelblinker

Ein Blinker tickt, solange er blinkt, damit man hört, dass er an ist. Hier treibt der LM386-Blinker neben seinen zwei LEDs auch einen Lautsprecher: über einen Kondensator, sodass jede Änderung des Ausgangs ein kurzes Ticken ist und der Lautsprecher dazwischen still bleibt.

**Vermittelt:** Kippschwinger, Koppelkondensator lässt nur Änderungen durch, ein Klick pro Flanke

## Was zu tun ist

Klick auf **Sim**, beobachte die LEDs und hör auf den Lautsprecher.

## Was du sehen solltest

- Rot und Grün wechseln sich ab, etwa 1,6-mal pro Sekunde.
- Bei jedem Wechsel tickt der Lautsprecher, einmal für jede LED.

## Warum es funktioniert

Der Ausgang des Verstärkers springt zwischen etwa 0,9 V und 8,1 V. Der Kondensator vor dem Lautsprecher lässt den Sprung durch, der die Membran einmal anstößt, und lädt sich dann auf, sodass der Strom durch den Lautsprecher in wenigen Millisekunden abklingt. Eine gleichbleibende Spannung kommt nicht durch einen Kondensator: Zwischen den Sprüngen ist der Lautsprecher still.
