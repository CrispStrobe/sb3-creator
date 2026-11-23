# Drehspul-Amperemeter: Nebenwiderstände und Knotenregel

Ein Zeigerinstrument, das schon bei 100 µA voll ausschlägt, ist für Milliampere nutzlos, außer der Großteil des Stroms fließt daran vorbei. Genau das macht ein kleiner Parallelwiderstand, der Shunt. Drei solche Messgeräte an einem Netzwerk zeigen den Gesamtstrom und die beiden Zweigströme, und die Zweigströme ergeben zusammen den Gesamtstrom.

**Vermittelt:** Nebenwiderstände, Stromteilung, Knotenregel nach Kirchhoff, Belastung durch das Messgerät

## Was zu tun ist

Klick auf **Sim**. Lies die drei Zeiger ab: gesamt sowie Zweig A und Zweig B, alle im 10-mA-Bereich. Addiere die beiden Zweigströme und vergleiche mit dem Gesamtstrom. Dann stell den Schalter um, der den Shunt des Gesamtstrommessers abtrennt, und sieh zu, wie dessen Zeiger an den Anschlag knallt.

## Was du sehen solltest

- Gesamt etwa 6,2 mA, Zweig A etwa 4,3 mA, Zweig B etwa 1,95 mA.
- Zweig A plus Zweig B ergibt den Gesamtstrom.
- Shunt abgetrennt: Zeiger am Anschlag, und die Zweigströme sinken.

## Warum es funktioniert

Bei Vollausschlag liegen an der Spule 0,1 V. Der Shunt mit 10,1 Ω lässt bei dieser Spannung 9,9 mA durch, Spule und Shunt zusammen also 10 mA. Ohne Shunt müsste die Spule das Tausendfache ihres Nennstroms tragen, um 6 mA anzuzeigen.
