# Unijunction-Metronom

**Vermittelt:** Kippschwingung, komplementäre Kippstufe, RC-Periode

## Was zu tun ist

Klick auf **Sim** und hör zu: Der Lautsprecher tickt, und die LED blitzt. Dreh den Knopf (potentiometer_4) auf und zu, um das Tempo einzustellen. Dann schieb TON (slide_switch_5) nach rechts: Aus dem Ticken wird ein Brummen, und der Knopf ändert die Tonhöhe.

## Was du sehen solltest

- Ticken von etwa viermal pro Sekunde (Knopf auf) bis einmal alle 2,3 s (Knopf zu).
- Bei TON ein Brummen von etwa 40 Hz bis etwa 340 Hz.

## Warum es funktioniert

Der Kondensator lädt sich langsam über den Knopf auf. Erreicht er den Schaltpunkt, kippen die beiden Transistoren ein und entladen ihn blitzartig über die LED und den Lautsprecher: ein Klick. Dann lassen sie wieder los, und der Kondensator lädt sich von neuem. Ein kleinerer Kondensator ist hundertmal schneller voll, also wird aus dem Klicken ein Ton.
