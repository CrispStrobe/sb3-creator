---
level: intermediate
age: 12+
prereqs: [lab-amp-horn, lab-light-link]
teaches: [light-barrier, oscillator, alarm]
---
## Was du siehst
Eine Infrarot-LED leuchtet über eine Lücke auf einen Fototransistor. Ein Audioverstärker-Chip und ein Lautsprecher warten still.

## Probier das
1. Klick auf **Sim**. Stille: Der Strahl ist da.
2. Schieb den Regler `blocked` am Lichtweg auf 1, als ginge jemand durch den Strahl. Der Lautsprecher schrillt los.
3. Schieb ihn zurück: wieder still.

## Was passiert hier
Der Verstärker ist so geschaltet, dass er schwingt: Sein Ausgang gibt dem eigenen Eingang über einen Kondensator einen Stoß, der Stoß klingt ab, bis der Verstärker zurückkippt, immer wieder, etwa 176-mal pro Sekunde. Solange der Strahl leuchtet, legt der Fototransistor eine kleine Spannung an den anderen Eingang des Verstärkers. Die Stöße kommen nicht über diese Spannung hinweg, also bleibt der Verstärker stehen und still. Wird der Strahl unterbrochen, ist die Spannung weg: Der Verstärker schwingt mit voller Kraft.

## Weiter geht's
- [lab-amp-horn](../lab-amp-horn) — derselbe Verstärker-Oszillator für sich allein.
- [lab-barrier-counter](../lab-barrier-counter) — zählen, wie oft ein Strahl unterbrochen wird.
