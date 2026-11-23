---
level: intermediate
age: 12+
prereqs: [pc68-555-sirene, pc06-rc-charge]
teaches: [voltage-controlled-oscillator, RC-envelope, 555-timer, siren]
---
## Was du siehst
Halte SIREN gedrückt: Nach einer kurzen Pause erscheint ein Ton, schwingt sich nach oben und bleibt hoch stehen. Lass los: Er gleitet nach unten und verklingt. Dieses Heulen kommt von einem einzigen Kondensator, der langsam lädt und entlädt.

## Probier das
1. Halte SIREN etwa zwei Sekunden, dann lass los. Hör (oder schau aufs Oszilloskop) auf den Anstieg, das gleichbleibende Hoch und den Abfall.
2. Tippe SIREN nur kurz an. Der Ton kommt nur halb nach oben, bevor er wieder sinkt.
3. Miss beim Spielen die Spannung an C_glide. Merk dir, bei welcher Spannung der Ton beginnt und endet: in beide Richtungen etwa 6 V.

## Was dahintersteckt
Der 555 kippt, wenn sein Zeitkondensator 6 V erreicht, zwei Drittel seiner Versorgung. Normalerweise lädt dieser Kondensator aus 9 V. Hier lädt er stattdessen aus dem Gleit-Kondensator, dessen Spannung steigt, solange du den Taster hältst, und fällt, wenn du loslässt. Liegt die Gleitspannung unter 6 V, erreicht der Zeitkondensator die Schwelle nie, also gibt es keinen Ton. Knapp über 6 V kommt er langsam hin (tiefer Ton), weit darüber schnell (hoher Ton). Die Tonhöhe folgt also der Gleitspannung: ein spannungsgesteuerter Oszillator, und Taster und Kondensator formen das Auf und Ab.

## Weiter geht's
- [pc68-555-sirene](../pc68-555-sirene): eine Sirene, deren Tonhöhe du von Hand mit einem Poti stellst.
- [lab-struck-note](../lab-struck-note): Ein Kondensator formt die Lautstärke statt der Tonhöhe.
