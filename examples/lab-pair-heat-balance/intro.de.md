# Einen Transistor des Paars erwärmen

**Vermittelt:** Differenzverstärker, Temperaturdrift, Kompensation

## Was zu tun ist

Klick auf **Sim**: Beide LEDs leuchten gleich. Schieb den **Temperatur**-Regler des ersten Transistors (npn_5) auf heiß und warte ein paar Sekunden. Dann schieb den des zweiten (npn_6) auch auf heiß. Dann stell den ersten zurück auf Raumtemperatur.

## Was du sehen solltest

- Erster heiß: Die rote LED wird heller, die grüne geht fast aus.
- Beide heiß: Sie sind wieder gleich.
- Nur der zweite heiß: Grün hell, Rot fast aus.

## Warum es funktioniert

Die beiden Transistoren teilen sich einen Emitterwiderstand, also wird der Strom durch ihn zwischen ihnen aufgeteilt. Der wärmere braucht weniger Basis-Emitter-Spannung und schnappt sich den größeren Anteil. Erwärmen sich beide gemeinsam, hat keiner einen Vorteil und die Aufteilung bleibt gleich: Das Paar übersieht eine Änderung, die beide Seiten gleich trifft.
