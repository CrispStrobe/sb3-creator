# Zahlenschloss aus NAND-Gattern mit Relais

Vier Schalter, zwei 74HC00 und ein Relais: Das Schloss öffnet nur bei einer einzigen Schalterstellung. Der Decoder besteht nur aus NAND-Gattern. Wo der Code einen Schalter auf AUS verlangt, läuft der Eingang zuerst durch ein als Inverter geschaltetes NAND, die übrigen Gatter verknüpfen dann alles zu einem UND.

**Vermittelt:** ein Bitmuster erkennen, NAND als Inverter und als UND, ein Relais aus der Logik ansteuern

## Was zu tun ist

Klick auf **Sim**. Die rote LED GESPERRT leuchtet. Stelle die vier DIP-Schalter um und such das Muster, bei dem das Relais anzieht und die grüne LED OFFEN leuchtet. Es gibt nur 16 Muster, geduldiges Raten führt also schnell zum Ziel. Ein echtes Schloss bräuchte viel mehr Schalter.

## Was du sehen solltest

| S1 | S2 | S3 | S4 | OFFEN | GESPERRT |
|---|---|---|---|---|---|
| aus | aus | aus | aus | aus | AN |
| AN | aus | AN | AN | AN | aus |
| alles andere | | | | aus | AN |

## Warum es funktioniert

Gatter 1 in U1 dreht S2 um. Gatter 2 verknüpft S1 mit dem invertierten S2, Gatter 3 verknüpft S3 und S4, und zwei weitere NANDs machen daraus wieder „wahr, wenn beide wahr sind“. Das letzte NAND in U2 meldet OFFEN nur, wenn beide Hälften zustimmen. Wer den Code ändern will, ändert, welche Eingänge durch einen Inverter laufen.
