---
level: advanced
age: 14+
prereqs: [lab-bridge-meter]
teaches: [microphone, amplifier, precision-rectifier, decibel]
---
## Was du siehst
Ein magnetischer Ohrhörer als Mikrofon und ein Vierfach-Operationsverstärker: Zwei Verstärker heben das Signal an, einer richtet mit Diode und Messinstrument in der Rückkopplung gleich, und einer hält die halbe Betriebsspannung als Bezug.

## Probier das
1. Klick auf **Sim**. Ein gleichmäßiger Ton mit 90 dB erreicht das Mikrofon, der Zeiger steht bei etwa einem Drittel der Skala.
2. Zieh in der Instrumentenspalte den Regler **Schall** auf 80: Der Zeiger fällt auf etwa ein Drittel.
3. Schieb ihn auf 96: etwa zwei Drittel der Skala. Sechs Dezibel mehr haben die Anzeige verdoppelt.
4. Stell ihn auf 0: Der Zeiger kehrt in die Ruhelage zurück.

## Was passiert hier
Die Spule des Ohrhörers macht aus dem Schall ein paar Millivolt. Die beiden Verstärkerstufen machen das etwa 240-mal größer, auf rund ein halbes Volt. Eine einfache Diode würde alles unter etwa 0,6 V verschlucken, aber hier sitzt die Diode in der Rückkopplung des Operationsverstärkers: Er treibt seinen Ausgang so weit, wie nötig ist, um den Strom (Signal minus halbe Betriebsspannung, geteilt durch den 560-Ω-Widerstand) durch Diode und Instrument zu schieben. So führt das Instrument genau die positiven Halbwellen, auch ganz kleine. Der Kondensator parallel dazu lässt den Zeiger ihren Mittelwert zeigen. Das Instrument ist linear im Schalldruck, unsere Ohren und die Dezibel-Skala aber logarithmisch: Alle 20 dB bedeuten zehnfachen Druck. Darum umfasst eine Skala nur etwa 20 dB.

## Weiter geht's
- [lab-bridge-meter](../lab-bridge-meter) — die Zweiweg-Version mit einer Brücke in der Rückkopplung.
- [lab-ring-relay](../lab-ring-relay) — ein Lautsprecher hört eine Telefonklingel.
