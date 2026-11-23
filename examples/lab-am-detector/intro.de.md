---
level: advanced
age: 14+
prereqs: [42-diode-rectifier, pc21-rc-smoothing]
teaches: [amplitude-modulation, envelope-detector, crystal-radio, rc-filter]
---
## Was du siehst
Drei übereinander geschaltete Signalquellen bilden einen kleinen Testsender: einen 20-kHz-Träger und zwei Seitenfrequenzen knapp darunter und darüber. Dahinter sitzt der klassische Detektorempfänger: eine Diode, ein Kondensator, ein Widerstand und ein Ohrhörer.

## Probier das
1. Leg einen Oszilloskop-Tastkopf an den Senderausgang: eine schnelle Welle, deren Höhe 500-mal pro Sekunde steigt und fällt.
2. Miss hinter der Diode und am Kondensator: die schnelle Welle ist weg, der langsame 500-Hz-Ton bleibt.
3. Ändere den Glättungskondensator auf 100 nF. Der Ton wird verschmiert, weil sich der Kondensator nicht schnell genug entladen kann.
4. Ändere ihn auf 1 nF. Jetzt sitzt ein schnelles Zittern auf dem Ton.

## Was passiert hier
Ein Radiosender kann Schall nicht direkt senden; er verändert die Höhe (Amplitude) einer schnellen Trägerwelle im Takt des Tons. Mathematisch ist das dasselbe, wie den Träger plus zwei benachbarte Frequenzen zu senden – genau so baut dieser Aufbau ihn auf. Die Diode lässt nur die positive Hälfte durch. Der Kondensator lädt sich auf jede Spitze auf und verliert dazwischen ein wenig über den Widerstand, so folgt seine Spannung dem Umriss der Spitzen – der Hüllkurve, also dem ursprünglichen Ton. Die Zeitkonstante muss lang sein gegenüber einer Trägerschwingung, aber kurz gegenüber einer Schwingung des Tons.

## Weiter geht's
- [lab-applause-meter](../lab-applause-meter) — derselbe Trick mit Diode und Kondensator, mit viel langsamerem Abklingen.
- [pc21-rc-smoothing](../pc21-rc-smoothing) — RC-Glättung für sich allein.
