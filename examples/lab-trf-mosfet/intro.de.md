# Eine MOSFET-HF-Stufe vor dem Demodulator

Ein Empfänger mit Schwingkreis, einem MOSFET, der die Hochfrequenz selbst verstärkt, einer Diode als Demodulator, einer Transistor-Tonstufe und einem Lautsprecherverstärker. Zwei Sender sind zu hören: ein Ortssender auf 700 kHz und ein Nachbar auf 740 kHz. Ein Schiebeschalter verbindet die Antenne entweder direkt mit dem Schwingkreis oder über einen winzigen 4,7-pF-Kondensator.

**Vermittelt:** HF-Verstärkung vor der Demodulation, lose und feste Antennenkopplung, Trennschärfe

## Was zu tun ist

Klick auf **Sim** und hör zu: der 400-Hz-Ton des Ortssenders. Leg dann den **Schiebeschalter** in die zweite Stellung und dreh den **Drehkondensator** auf etwa 0,40, um den Sender wiederzufinden.

## Was du sehen solltest

- Direkte Kopplung: laut; der MOSFET macht die HF etwa 15-mal größer, bevor die Diode sie sieht.
- Über 4,7 pF: viel leiser (etwa ein Neuntel der HF), aber die Abstimmung ist schärfer — der Nachbarsender wird stärker unterdrückt.
- Die Abstimmung verschiebt sich etwas mit der Kopplung: Direkt angeschlossen gehört die Eigenkapazität der Antenne zum Schwingkreis.

## Warum es funktioniert

Eine Diode braucht einige Zehntel Volt, bevor sie gut gleichrichtet; ein schwacher Sender liefert weit weniger. Wird die HF zuerst verstärkt, arbeitet die Diode in ihrem guten Bereich. Die Antenne belastet den Schwingkreis: Direkt angeschlossen dämpft sie ihn, die Resonanz wird breit; über einen kleinen Kondensator entzieht sie ihm wenig Energie, der Kreis bleibt scharf, aber es kommt auch weniger vom Sender herein.
