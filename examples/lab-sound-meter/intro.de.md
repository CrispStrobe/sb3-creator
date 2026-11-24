---
level: advanced
age: 14+
prereqs: [lab-bridge-meter]
teaches: [microphone, amplifier, precision-rectifier, decibel]
---
## Was du siehst
Ein magnetischer Ohrhörer als Mikrofon, zwei Transistor-Verstärkerstufen und ein Operationsverstärker mit Diode und Messinstrument in der Rückkopplung.

## Probier das
1. Klick auf **Sim** und warte einen Moment, bis sich die Arbeitspunkte eingestellt haben. Ein gleichmäßiger Ton mit 90 dB erreicht das Mikrofon, der Zeiger steht etwas unter der Mitte.
2. Zieh in der Instrumentenspalte den Regler **Schall** auf 80: Der Zeiger fällt auf etwa ein Drittel.
3. Schieb ihn auf 96: fast Vollausschlag. Sechs Dezibel mehr haben die Anzeige verdoppelt.
4. Stell ihn auf 0: Der Zeiger kehrt in die Ruhelage zurück.

## Was passiert hier
Die Spule des Ohrhörers macht aus dem Schall ein paar Millivolt. Die beiden Transistorstufen verstärken das auf etwa ein Volt. Eine einfache Diode würde alles unter etwa 0,6 V verschlucken, aber hier sitzt die Diode in der Rückkopplung des Operationsverstärkers: Er treibt seinen Ausgang so weit, wie nötig ist, um den Strom (Signal minus halbe Betriebsspannung, geteilt durch den 560-Ω-Widerstand) durch Diode und Instrument zu schieben. So führt das Instrument genau die positiven Halbwellen, auch ganz kleine. Der Kondensator parallel dazu lässt den Zeiger ihren Mittelwert zeigen. Das Instrument ist linear im Schalldruck, unsere Ohren und die Dezibel-Skala aber logarithmisch: Alle 20 dB bedeuten zehnfachen Druck. Darum umfasst eine Skala nur etwa 20 dB.

## Weiter geht's
- [lab-bridge-meter](../lab-bridge-meter) — die Zweiweg-Version mit einer Brücke in der Rückkopplung.
- [lab-ring-relay](../lab-ring-relay) — ein Lautsprecher hört eine Telefonklingel.
