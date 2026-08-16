---
level: advanced
age: 14+
prereqs: [pc81-led-lauflicht]
teaches: [555-timer, CD4017, RC-decay, roulette, randomness]
---
## Was du siehst
Ein Mini-Roulette: drücke den Taster und die LEDs rasen im Kreis. Beim Loslassen verlangsamt sich das Lauflicht und bleibt auf einer zufälligen Position stehen — ein elektronisches Glücksrad.

## Probier das
1. Drücke den Taster — die LEDs laufen schnell.
2. Loslassen — das Lauflicht wird langsamer und stoppt.
3. Die Stoppposition ist „zufällig" (abhängig vom Loslasszeitpunkt und der RC-Abklingkurve).

## Was passiert hier
Der Taster setzt den 555-Timer über den Reset-Pin in Betrieb. Ein RC-Glied am Control-Pin (Pin 5) verändert die interne Schwelle: anfangs schwingt der Timer schnell, dann verlangsamt die aufladende Kapazität die Taktrate, bis der Timer stoppt. Der CD4017 hält den letzten aktiven Ausgang — das ist die „gewürfelte" Position.

## Weiter geht's
- [pc83-gluecksrad](../pc83-gluecksrad) — gleiche Schaltung mit Schüttelsensor statt Taster.
- [pc81-led-lauflicht](../pc81-led-lauflicht) — das Lauflicht ohne Verlangsamung.
