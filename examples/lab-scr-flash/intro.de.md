---
level: advanced
age: 14+
prereqs: [lab-scr-pair]
teaches: [thyristor, phototransistor, edge-trigger, slave-flash]
---
## Was du siehst
Einen Thyristor aus zwei Transistoren, der eine weiße „Blitzlampe" schaltet, und einen Fototransistor, der den Raum beobachtet. Ein echter Slave-Blitz zündet in dem Moment, in dem er einen anderen Blitz sieht.

## Was du tun kannst
1. Klick auf **Sim**. Die Lampe ist dunkel.
2. Schieb den **Licht**-Schieber des Fototransistors langsam bis zur Mitte. Nichts passiert: Langsame Änderungen des Raumlichts werden ignoriert.
3. Schieb ihn zurück auf 0 und dann mit einem Sprung auf volles Licht (ein Blitz). Die Lampe geht an und bleibt an.
4. Schalte den Hauptschalter aus und wieder ein, um ihn zurückzusetzen.

## Was passiert hier
Die Emitterspannung des Fototransistors folgt dem Licht. Zwischen ihm und dem Gate sitzt ein Kondensator, der nur Änderungen durchlässt: Eine langsame Änderung ergibt einen winzigen Strom, ein plötzlicher Sprung einen kräftigen Impuls. Dieser Impuls schaltet den Thyristor ein, und wie bei lab-scr-pair halten sich die beiden Transistoren dann gegenseitig, bis der Hauptstrom unterbrochen wird.

## Weiter geht's
- [lab-scr-pair](../lab-scr-pair) — der Thyristor aus zwei Transistoren, gezündet per Taster.
- [lab-scr-dimmer](../lab-scr-dimmer) — derselbe Thyristor an Wechselspannung.
