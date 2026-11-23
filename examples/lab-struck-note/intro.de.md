---
level: intermediate
age: 12+
prereqs: [pc67-555-tongenerator, pc43-bleeder-discharge]
teaches: [envelope, attack-decay, RC-discharge, sound-synthesis, 555-timer]
---
## Was du siehst
Ein Gong oder ein Klavierton schaltet nicht einfach ein und aus: Er beginnt laut und klingt aus. Tippe KEY an, und diese Schaltung macht dasselbe, ein Ton, der über etwa zwei Sekunden verklingt. Hältst du KEY, bleibt der Ton stehen.

## Probier das
1. Starte die Simulation. Der 555 läuft schon, trotzdem hörst du nichts.
2. Tippe KEY kurz an. Der Ton beginnt laut und verklingt.
3. Halte KEY gedrückt: Der Ton bleibt laut. Lass los, und das Ausklingen beginnt.
4. Dreh zwischen den Anschlägen an DECAY für einen langen Gong oder ein kurzes Zupfen.

## Was dahintersteckt
Der 555 erzeugt einen gleichmäßigen Ton, aber der Lautsprecher kann nur so laut sein, wie die Spannung an C_env es erlaubt. KEY füllt diesen Kondensator fast sofort (der Anschlag); danach entlädt er sich über die Abklingwiderstände in etwa einer Sekunde (das Ausklingen), und der Ausschlag am Lautsprecher schrumpft mit. Die Zeitkonstante ist R × C, eine größere DECAY-Einstellung heißt also längeres Klingen. Synthesizer trennen genau diese beiden Aufgaben: Ein Oszillator bestimmt, welchen Ton du hörst, eine Hüllkurve bestimmt, wie er beginnt und endet.

## Weiter geht's
- [lab-siren-glide](../lab-siren-glide): Ein Kondensator formt die Tonhöhe statt der Lautstärke.
- [pc43-bleeder-discharge](../pc43-bleeder-discharge): ein Kondensator entlädt sich über einen Widerstand.
