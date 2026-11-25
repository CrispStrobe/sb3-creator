# Metronom, Motor und Sirene

Ein Tongenerator, drei Kondensatoren. Mit dem großen tickt er wie ein Metronom, mit dem mittleren knattert er wie ein Motor, mit dem kleinen pfeift er — und der Drehknopf macht jeden davon schneller oder langsamer.

**Vermittelt:** RC-Oszillator, Periode und Kapazität, Frequenzbereich

## Was zu tun ist

Klick auf **Sim**. Der Schalter TICK (switch_12) ist geschlossen: hör auf das Ticken, schau auf die rote LED und dreh am Knopf (potentiometer_8). Öffne TICK und schließ MOTOR (switch_10): dreh den Knopf auf wie einen Gasgriff. Öffne auch MOTOR und dreh den Knopf hin und her — eine Sirene.

## Was du sehen solltest

- TICK: Bei zugedrehtem Knopf wechselt die LED alle 1,2–1,7 s, aufgedreht etwa alle 0,2 s; der Lautsprecher tickt bei jedem Wechsel.
- MOTOR: ein Knattern von etwa 15 Schlägen pro Sekunde, das beim Aufdrehen zu einem Brummen von etwa 120 wird.
- Keiner von beiden: ein Ton von etwa 340 Hz bis etwa 2,7 kHz.

## Warum es funktioniert

Der Verstärker kippt seinen Ausgang jedes Mal, wenn sich der Kondensator am −-Eingang über eine Schwelle auf- oder entladen hat. Wie lange das dauert, ist proportional zur Kapazität und zum Widerstand, über den er lädt: ein tausendmal größerer Kondensator macht ihn tausendmal langsamer, und der Knopf ändert den Widerstand.
