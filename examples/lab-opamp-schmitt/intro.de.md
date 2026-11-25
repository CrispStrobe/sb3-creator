# Schmitt-Trigger mit Op-Amp

Ein Komparator mit etwas Mitkopplung hat nicht mehr einen Schaltpunkt, sondern zwei: hoch bei einer Spannung, herunter bei einer niedrigeren. Dazwischen merkt er sich, woher er kam.

**Vermittelt:** Schmitt-Trigger, Hysterese, Mitkopplung, Komparator

## Was zu tun ist

Klick auf **Sim**. Dreh den Eingangsknopf (potentiometer_3) langsam auf, bis die rote LED angeht, und lies das Voltmeter (voltmeter_4) ab; dreh dann langsam zurück, bis Grün wiederkommt, und lies noch einmal ab. Öffne den Rückkopplungsschalter (switch_7) und mach dasselbe.

## Was du sehen solltest

- Mit Rückkopplung: Rot beim Aufdrehen bei etwa 5,5 V, Grün beim Zurückdrehen erst bei etwa 3,8 V. Bleib dazwischen stehen, und die LED zeigt, aus welcher Richtung du kamst.
- Ohne Rückkopplung: beides bei 4,5 V — eine Schwelle.

## Warum es funktioniert

Geht der Ausgang hoch, hebt der Rückkopplungswiderstand den +-Eingang noch ein Stück an: der Eingang muss jetzt deutlich unter den Schaltpunkt fallen, bevor der Ausgang zurückkippen kann. Ist der Ausgang unten, zieht er den +-Eingang herunter, also muss der Eingang erst über den Schaltpunkt steigen. Ein kleines Zittern am Eingang lässt den Ausgang nicht mehr flattern.
