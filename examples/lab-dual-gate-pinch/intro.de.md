# Zwei Gates, ein Kanal: jedes kann ihn schließen

Ein Dual-Gate-MOSFET hat zwei Gates hintereinander über demselben Kanal. Jedes Gate hat hier sein eigenes Poti. Dreht man eines weit genug herunter, geht die LED aus, egal was das andere Gate tut. Dazwischen dimmt ein Gate die LED stufenlos.

**Vermittelt:** Dual-Gate-MOSFETs, Abschnürung, ein Gate als stufenloser Regler

## Was zu tun ist

Klick auf **Sim**. Beide Potis stehen auf dem Potenzial der Source, die LED leuchtet. Dreh das Poti von Gate 2 langsam herunter und sieh zu, wie die LED dunkler wird und ausgeht. Dreh es wieder hoch. Dreh nun stattdessen das Poti von Gate 1 herunter und versuch, Gate 2 ganz aufzudrehen, während Gate 1 unten ist.

## Was du sehen solltest

- Beide Gates auf dem Potenzial der Source: die LED leuchtet, etwa 3 mA.
- Gate 2 geht herunter: die LED wird stufenlos dunkler und geht etwa 1,2 V unter der Source aus.
- Gate 1 unten: dunkel, auch wenn Gate 2 ganz aufgedreht ist.

## Warum es funktioniert

Die beiden Gates sitzen über zwei Hälften eines Kanals, hintereinander, wie zwei Hähne in einem Rohr. Schließt einer, hört der Fluss auf. Die Source wird durch die beiden Widerstände auf etwa 3,3 V angehoben, damit die Potis jedes Gate darunter bringen können: Dieser Verarmungs-MOSFET leitet voll, wenn die Gates auf dem Potenzial der Source liegen, und schnürt erst etwa 1,2 V tiefer ab.
