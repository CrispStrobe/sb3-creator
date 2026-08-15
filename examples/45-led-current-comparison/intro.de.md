---
level: beginner
age: 8+
prereqs: []
teaches: [current-comparison, ohms-law, brightness]
---
## Was du siehst
Drei LEDs nebeneinander, jede mit einem anderen Widerstandswert. Die LED mit dem kleinsten Widerstand leuchtet am hellsten, die mit dem groessten am schwächsten. Gleiche Versorgungsspannung, gleiche LEDs — nur die Widerstaende unterscheiden sich, und die Helligkeit zeigt, welche mehr Strom fuehrt.

## Probier das
1. Starte die Simulation und vergleiche die Helligkeit der drei LEDs.
2. Pruefe den Strom durch jede LED — die mit dem kleinsten Widerstand fuehrt den meisten.
3. Tausche zwei Widerstandswerte und sage vorher, welche LED nun am hellsten leuchtet, bevor du die Simulation startest.

## Was passiert hier
Jeder LED-Stromkreis ist eine Reihenschleife: Versorgung, Widerstand, LED, Masse. Der Widerstand bestimmt den Strom nach dem Ohmschen Gesetz: I = (VCC - Vled) / R. Ein kleinerer Widerstand bedeutet mehr Strom und eine hellere LED. Der Spannungsabfall der LED ist annaehernd konstant (etwa 2 V fuer Rot), also nimmt der Widerstand die restliche Spannung auf. Das ist eine direkte, visuelle Demonstration, dass der Widerstand den Strom steuert und der Strom die Helligkeit.

## Warum das wichtig ist
Den richtigen Widerstand fuer eine LED zu waehlen, ist eine der ersten echten Berechnungen, die jeder Elektronikbastler macht. Dieses Beispiel baut Intuition fuer das Ohmsche Gesetz auf, ohne eine Formel — du siehst das Ergebnis direkt.

## Weiter geht's
- [21-resistor-led](../21-resistor-led) — untersuche die Einzeln-LED-Version im Detail, einschliesslich was ohne Widerstand passiert.
- [34-ohms-law](../34-ohms-law) — erkunde den Zusammenhang zwischen Spannung, Strom und Widerstand formaler.
- Experiment: Berechne den genauen Strom fuer jede LED mit dem Ohmschen Gesetz und vergleiche deine Zahlen mit den Simulationswerten.
