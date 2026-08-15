---
level: intermediate
age: 14+
prereqs: [pc05-npn-switch]
teaches: [mosfet, voltage-control, gate-resistor]
---
## Was du siehst
Ein N-Kanal-MOSFET schaltet eine LED auf der Low-Side. Das Gate wird durch einen 10-kΩ-Pull-down-Widerstand auf Masse gehalten, und ein Schalter hebt es auf 5 V, um die LED einzuschalten.

## Probier das
1. Klick auf **Sim** bei offenem Gate-Schalter. Das Gate liegt auf 0 V und die LED ist dunkel — der MOSFET sperrt.
2. Schließe den Gate-Schalter. Das Gate geht auf 5 V, der MOSFET schaltet durch, und die LED leuchtet.
3. Beachte die Drain-Spannung: Im Ein-Zustand fällt sie auf etwa 0,14 V statt auf null — das ist der Einschaltwiderstand des MOSFETs.

## Was passiert hier
Ein MOSFET ist ein spannungsgesteuerter Schalter. Anders als ein Bipolartransistor (pc05) zieht das Gate keinen Dauerstrom — es ist ein Kondensator, keine Diode. Der 10-kΩ-Pull-down-Widerstand sorgt dafür, dass das Gate bei offenem Schalter auf einem definierten Spannungsniveau liegt; ohne ihn würde es schweben und der Transistor könnte zufällig schalten. Wenn das Gate auf High liegt, leitet der MOSFET von Drain zu Source mit einem kleinen Spannungsabfall.

## Warum das wichtig ist
MOSFETs sind das dominierende Schaltelement der modernen Elektronik — jeder Prozessor, jedes Netzteil, jeder Motortreiber nutzt sie. Ihr spannungsgesteuertes Gate bedeutet, dass sie direkt von Logiksignalen angesteuert werden können, mit vernachlässigbarem Leistungsverlust am Steuereingang.

## Weiter geht's
- [pc05-npn-switch](../pc05-npn-switch) — Vergleich mit einem Bipolartransistor: Die Basis zieht Strom, das Gate nicht.
- [pc44-push-pull-led](../pc44-push-pull-led) — N- und P-Kanal-MOSFETs arbeiten zusammen.
- Experiment: Entferne den Pull-down-Widerstand und beobachte, was passiert, wenn du den Schalter öffnest — das Gate merkt sich seinen letzten Zustand.
