# Dämmerungsschalter

Wird es dunkel, schaltet die Lampe ein, wird es hell, schaltet sie aus – aber nicht bei derselben Helligkeit, damit sie in der Dämmerung nicht flackert.

**Vermittelt:** Lichtsensor, Schmitt-Trigger, Hysterese

## Was zu tun ist

Klick auf **Sim**. Zieh den Licht-Regler des Fototransistors (phototransistor_3) langsam hoch, bis die grüne LED TAG leuchtet. Zieh ihn dann langsam runter, bis die gelbe LED LAMPE wieder leuchtet. Schließ ENG (switch_7) und mach es noch einmal.

## Was du sehen solltest

- TAG schaltet bei etwa 0,55 Licht ein, LAMPE kommt erst bei etwa 0,25 zurück.
- Mit ENG: TAG bei etwa 0,43, LAMPE bei 0,2 – die beiden Punkte liegen näher beieinander.

## Warum es funktioniert

Je mehr Licht auf den Fototransistor fällt, desto mehr Strom lässt er durch und desto höher ist die Spannung am Eingang des 555. Der 555 schaltet um, wenn der Eingang 6 V überschreitet, und erst wieder zurück, wenn er unter 3 V fällt. Der Widerstand am Steuereingang senkt beide Schaltspannungen und rückt sie näher zusammen.
