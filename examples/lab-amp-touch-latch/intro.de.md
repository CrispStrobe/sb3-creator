# Verstärker-Chip als Speicher und Monoflop

Derselbe Verstärker-Chip, der Musik spielt, kann sich eine Berührung merken — oder, mit einem Kondensator statt eines Widerstands, eine Lampe nach dem Berühren für eine feste Zeit leuchten lassen.

**Vermittelt:** Setz-/Rücksetz-Speicher, Monoflop, Darlington-Berührungssensor

## Was zu tun ist

Klick auf **Sim**. Drück die Berührungstaste (button_3, dein Finger) und lass los, dann die Reset-Taste (button_14). Schieb den **Schiebeschalter** nach rechts und berühr noch einmal.

## Was du sehen solltest

- Links: Eine Berührung schaltet die LED ein, und sie bleibt an; RESET schaltet sie aus.
- Rechts: Die LED bleibt etwa eine Viertelsekunde an und geht von selbst aus.

## Warum es funktioniert

Mit dem Widerstand kommt ein Teil des hohen Ausgangs zum +-Eingang zurück und hält ihn über den 3 V am −-Eingang: Der Chip hält sich selbst. Mit dem Kondensator wird der Sprung des Ausgangs nur kurz zurückgegeben; während sich der Kondensator lädt, sinkt der +-Eingang unter 3 V, und der Ausgang fällt zurück.
