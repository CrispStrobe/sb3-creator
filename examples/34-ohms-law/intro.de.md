---
level: beginner
age: 8+
prereqs: []
teaches: [ohms-law, resistance, current]
---

## Was du siehst

Eine Spannungsquelle, ein Widerstand und eine LED sind in Reihe geschaltet. Die
Spannung ueber dem Widerstand und der Strom durch die Schaltung werden
angezeigt. Das ist die einfachste vollstaendige Schaltung ueberhaupt: eine
Quelle, eine Last und ein Draht, der sie verbindet.

## Probier das aus

1. Klick auf **Sim** und lies die Spannung ueber dem Widerstand und den Strom
   durch die Schaltung ab.
2. Aendere den Widerstand auf einen hoeheren Wert -- verdopple ihn. Der Strom
   sinkt auf die Haelfte. Die Spannung ueber der LED bleibt ungefaehr gleich.
3. Aendere den Widerstand auf einen niedrigeren Wert -- halbiere den
   Ausgangswert. Der Strom verdoppelt sich. Das ist das Ohmsche Gesetz in
   Aktion: I = V / R.

## Was passiert hier

Das Ohmsche Gesetz sagt, dass der Strom gleich der Spannung geteilt durch den
Widerstand ist (I = U / R). Die Versorgung liefert eine feste Spannung. Die LED
hat einen ungefaehr konstanten Spannungsabfall (etwa 2 V bei einer roten LED).
Die restliche Spannung faellt ueber dem Widerstand ab, und diese Spannung
geteilt durch den Widerstandswert ergibt den Strom. Aendere R, und der Strom
aendert sich genau umgekehrt proportional. Das ist keine Naeherung -- es ist
eine der am praezisesten bestaetigten Beziehungen der Physik.

## Warum das wichtig ist

Jede Schaltungsberechnung beginnt mit dem Ohmschen Gesetz. Einen Widerstand fuer
eine LED waehlen, ein Netzteil dimensionieren, verstehen, warum ein Draht heiss
wird -- alles fuehrt zurueck auf U = I * R. Es sind drei Buchstaben, und es ist
das Fundament fuer alles andere in der Elektronik.

## Weiter geht's

- **Widerstaende zusammenschalten:**
  [35-series-resistors](../35-series-resistors) -- was passiert, wenn man zwei
  Widerstaende hintereinander schaltet.
- **Die LED ohne ihren Widerstand:**
  [31-no-resistor-led](../31-no-resistor-led) -- warum das Weglassen von R
  zerstoererisch ist.
- **Zum Ausprobieren:** Probiere bei festem Widerstand Versorgungsspannungen von
  3,3 V und 5 V. Berechne den erwarteten Strom fuer beide, bevor du simulierst,
  und pruefe dann nach. Wenn deine Vorhersage daneben liegt, denk daran, zuerst
  die Flussspannung der LED abzuziehen.
