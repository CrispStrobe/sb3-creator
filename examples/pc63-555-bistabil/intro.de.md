---
level: intermediate
age: 12+
prereqs: [pc47-555-monostable]
teaches: [555-timer, bistable, flip-flop, set-reset]
---
## Was du siehst
Ein 555-Timer als bistabile Kippstufe (Flip-Flop). Zwei Taster steuern den Ausgang: Set schaltet die LED ein, Reset schaltet sie aus. Der Timer merkt sich den Zustand — ohne Strom an den Tasten bleibt die LED in ihrer letzten Position.

## Probier das
1. Klick auf **Sim** — die LED ist zunächst dunkel.
2. Drücke den Set-Taster — die LED leuchtet und bleibt an.
3. Drücke den Reset-Taster — die LED erlischt und bleibt aus.
4. Kein Taster gedrückt: der Zustand bleibt gespeichert.

## Was passiert hier
Im bistabilen Modus nutzt der 555 nur seinen Trigger- und seinen Threshold-Eingang. Ein kurzer Low-Impuls am Trigger (Pin 2) setzt den Ausgang auf High. Ein High-Impuls am Threshold (Pin 6) setzt den Ausgang auf Low. Der Kondensator-Zeitgeber wird nicht gebraucht — der IC arbeitet als reines RS-Flip-Flop.

## Warum das wichtig ist
Ein Flip-Flop ist die einfachste Form von Speicher: ein Bit. Diese Schaltung zeigt das Grundprinzip jedes digitalen Speichers, vom SRAM-Bit bis zum Prozessorregister.

## Weiter geht's
- [pc47-555-monostable](../pc47-555-monostable) — der gleiche Timer als Einmal-Impuls.
- [51-555-astable](../51-555-astable) — der Timer als astabiler Blinker.
- [pc71-nand-entpreller](../pc71-nand-entpreller) — ein RS-Latch aus NAND-Gattern.
