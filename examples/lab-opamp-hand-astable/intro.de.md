# Eine Kippstufe von Hand, dann von selbst

Füll einen Kondensator mit einem Taster und leer ihn mit einem anderen: ein Schmitt-Trigger aus einem Operationsverstärker kippt jedes Mal, wenn der Kondensator eine seiner zwei Schwellen überschreitet. Dann lässt du den Operationsverstärker das Füllen und Leeren selbst erledigen.

**Vermittelt:** Schwellen des Schmitt-Triggers, RC-Ladung, der astabile Multivibrator

## Was zu tun ist

Klick auf **Sim**. Halte CHARGE (button_7) und beobachte das Messgerät am Kondensator (voltmeter_18) und die LEDs. Lass los und halte dann DRAIN (button_9). Zum Schluss schließ AUTO (switch_12).

## Was du sehen solltest

- CHARGE: Die Anzeige steigt; bei etwa 5,5 V geht die grüne LED aus und die rote an. So bleibt es, wenn du loslässt.
- DRAIN: Die Anzeige fällt; bei etwa 3 V schaltet es zurück auf Grün.
- AUTO: Es blinkt von selbst, etwa alle anderthalb Sekunden.

## Warum es funktioniert

Der Operationsverstärker vergleicht den Kondensator mit einer Spannung, die sein eigener Ausgang verschiebt: 5,5 V bei Grün, 3 V bei Rot. Deshalb kippt er nicht sofort zurück, wenn der Kondensator ein wenig schwankt, sondern wartet auf die andere Schwelle. Mit AUTO lädt der Ausgang den Kondensator selbst in Richtung der Schwelle, die ihn wieder kippen lässt.
