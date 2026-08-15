---
level: beginner
age: 12+
prereqs: [15-voltage-divider]
teaches: [capacitor, rc-charging, adc-sampling]
---

## Was du siehst

Ein Widerstand und ein Kondensator sind in Reihe von einem MCU-Pin nach Masse
geschaltet. Der MCU setzt den Pin auf High, und der ADC an einem zweiten Pin
liest die Spannung ueber dem Kondensator, waehrend er sich auflaedt. Die
Spannung steigt anfangs schnell, wird dann langsamer und zeichnet die klassische
RC-Ladekurve nach.

## Probier das aus

1. Klick auf **Sim**. Der MCU setzt den Pin auf High und der ADC-Wert steigt
   von 0 in Richtung Versorgungsspannung.
2. Beobachte die Steilheit des Anstiegs. Am Anfang ist er steil, und er
   flacht ab, je naeher der Kondensator der vollen Ladung kommt.
3. Aendere den Widerstandswert -- verdopple ihn. Die Kurve hat die gleiche
   Form, braucht aber doppelt so lange, um die gleiche Spannung zu erreichen.
   Die Zeitkonstante (R mal C) hat sich verdoppelt.

## Was passiert hier

Ein Kondensator speichert Ladung, und ein Widerstand begrenzt, wie schnell
Ladung hineinfliessen kann. Zusammen bilden sie einen RC-Kreis mit der
Zeitkonstante tau = R * C. Nach einer Zeitkonstante erreicht der Kondensator
etwa 63 % der Versorgungsspannung; nach fuenf Zeitkonstanten ist er praktisch
voll geladen. Der ADC des MCU tastet die Spannung in regelmaessigen Abstaenden
ab und liefert dir ein digitales Abbild dieser analogen Kurve. Die Form ist
immer dieselbe Exponentialfunktion -- nur die Geschwindigkeit aendert sich mit
R und C.

## Warum das wichtig ist

RC-Ladung ist die Grundlage von Zeitgeberschaltungen, Filtern und
Beruehrungssensoren. Jedes Mal, wenn du ein Signal siehst, das exponentiell
ansteigt oder abklingt -- ein Lautsprecher, der ausklingt, ein Sensor, der sich
einschwingt, ein Netzteil, das sich stabilisiert -- steckt eine RC-Zeitkonstante
dahinter.

## Weiter geht's

- **Der Spannungsteiler, auf dem das aufbaut:**
  [15-voltage-divider](../15-voltage-divider) -- statische
  Widerstandsverhaeltnisse, bevor die Zeitdimension dazukommt.
- **RC fuer Zeitmessung:** [43-rc-timing](../43-rc-timing) -- die Ladezeit
  nutzen, um etwas zu messen.
- **Zum Ausprobieren:** Ersetze den Kondensator durch einen zehnmal groesseren.
  Die Kurvenform ist identisch, aber zehnmal langsamer. Sag die neue
  Zeitkonstante vorher, bevor du die Simulation startest, und pruefe nach.
