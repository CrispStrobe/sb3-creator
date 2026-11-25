# Komplementärer Zeitschalter mit Bereit-Anzeige

**Vermittelt:** komplementäres Monoflop, RC-Zeitglied, Zustandsanzeige

## Was zu tun ist

Klick auf **Sim**: Die grüne LED BEREIT leuchtet. Drück START (button_3): Die rote LED AKTIV leuchtet und BEREIT geht aus, bis die Zeit um ist. Schließ LANG (switch_12), drück noch einmal START und warte.

## Was du sehen solltest

- Ohne LANG: AKTIV für weniger als eine Sekunde.
- Mit LANG: AKTIV für über eine halbe Minute.
- BEREIT leuchtet immer dann, wenn AKTIV nicht leuchtet.

## Warum es funktioniert

START schaltet den NPN ein, der den PNP einschaltet; dessen Kollektor springt auf +9 V und versorgt über den Kondensator die Basis des NPN weiter. Während sich der Kondensator lädt, wird dieser Strom kleiner, und wenn er zu klein ist, lässt das Paar los. Ein größerer Kondensator braucht länger zum Laden, also dauert es länger. Der dritte Transistor schließt einfach die grüne LED kurz, solange der PNP an ist.
