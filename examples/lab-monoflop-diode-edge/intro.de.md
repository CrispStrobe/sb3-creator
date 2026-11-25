# Monoflop: Dauer-Trigger, Flanken-Trigger, Diode

**Vermittelt:** Monoflop, Flankentriggerung, Zeitglied

## Was zu tun ist

Klick auf **Sim** und drück kurz auf den Taster (button_15): Die rote LED leuchtet kurz auf. Halt ihn gedrückt: Rot bleibt an. Schieb TRIGGER (slide_switch_16) nach rechts und halt den Taster noch einmal: Jetzt hat der Impuls eine feste Länge. Zum Schluss öffne den Schalter DIODE (switch_12) und drück noch einmal.

## Was du sehen solltest

- Kurzer Druck: etwa 0,7 s Rot.
- TRIGGER links und gehalten: Rot, solange du hältst.
- TRIGGER rechts: etwa 0,7 s, egal wie lange du hältst.
- DIODE offen: etwas länger, etwa 0,74 s.

## Warum es funktioniert

Der Druck schaltet Q1 ein. Sein Kollektor fällt ab, und der Kondensator gibt diesen Sprung an die Basis von Q2 weiter, also schaltet Q2 ab und hält Q1 an. Dann lädt sich der Kondensator über 100 kΩ wieder auf; wenn die Basis von Q2 hoch genug ist, kippt alles zurück. Ein Trigger über einen Kondensator gibt nur den Moment des Drückens weiter, also spielt es keine Rolle, wie lange du hältst.
