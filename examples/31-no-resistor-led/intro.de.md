---
level: beginner
age: 8+
prereqs: [21-resistor-led]
teaches: [overcurrent, current-limiting, component-damage]
---

## Was du siehst

Eine LED ist ohne Vorwiderstand direkt von VCC nach Masse verdrahtet. Die
Design-Rule-Pruefung (DRC) gibt eine Warnung aus: Der berechnete Strom von etwa
300 mA uebersteigt die 20-mA-Nennleistung der LED bei Weitem. Diese Schaltung
wird dir gezeigt, damit du verstehst, warum jedes andere LED-Beispiel einen
Widerstand enthaelt.

## Probier das aus

1. Lies die DRC-Warnung, bevor du irgendetwas startest. Sie nennt dir den Strom
   und den Nennwert.
2. Klick auf **Sim**. Die LED leuchtet, aber der Stromwert bestaetigt, dass sie
   viel zu viel zieht.
3. Fuege jetzt einen 220-Ohm-Widerstand in Reihe mit der LED ein und starte
   die Simulation erneut. Der Strom faellt auf einen sicheren Wert und die
   DRC-Warnung verschwindet.

## Was passiert hier

Eine LED hat einen sehr geringen Widerstand, sobald sie leitet. Ohne einen
Widerstand zur Strombegrenzung drueckt die Versorgung so viel Strom wie moeglich
durch die LED. In einer echten Schaltung wuerde die LED innerhalb von Sekunden
ueberhitzen und durchbrennen -- oder, bei einer schwachen Versorgung, die
Spannung einbrechen und die LED wuerde schwach flackern, bevor sie stirbt. Der
Widerstand ist keine optionale Dekoration; er ist das Bauteil, das aus einem
zerstoererischen Kurzschluss eine sichere, kontrollierte Lichtquelle macht.

## Warum das wichtig ist

Strombegrenzung ist die erste Regel beim Ansteuern jedes Bauteils: LEDs,
Motoren, Transistor-Basen und Kommunikationsleitungen brauchen alle etwas, das
den Strom auf ein sicheres Niveau setzt. Wer darauf verzichtet, riskiert nicht
nur ein Bauteil -- in einer dicht bestueckten Schaltung kann die ueberschuessige
Waerme auch benachbarte Bauteile beschaedigen.

## Weiter geht's

- **Die richtige Variante:** [21-resistor-led](../21-resistor-led) -- dieselbe
  LED mit dem Widerstand, der sie sicher macht.
- **Die Zahlen verstehen:** [34-ohms-law](../34-ohms-law) -- wie man berechnet,
  welchen Widerstandswert man braucht.
- **Zum Ausprobieren:** Probiere Widerstandswerte von 100, 220, 470 und
  1000 Ohm und notiere jeweils den Strom. Trage Strom gegen Widerstand auf --
  du siehst die Kurve der reziproken Beziehung V = I * R in Aktion.
