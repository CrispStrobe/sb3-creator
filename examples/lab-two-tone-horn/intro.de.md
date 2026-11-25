# Zweiklanghorn: ein langsamer OPV schaltet die Tonhöhe um

Feuerwehr und Krankenwagen nutzen zwei abwechselnde Töne. Hier schaltet ein langsamer OPV-Oszillator einen Transistor-Tongenerator zwischen zwei Tonhöhen um.

**Vermittelt:** Multivibrator, Tonhöhe mit einer Spannung steuern, zusammenarbeitende Oszillatoren

## Was zu tun ist

Klick auf **Sim** und hör zu. Schalte **SOUND** aus und wieder ein.

## Was du sehen solltest

- Zwei Töne wechseln sich ab, ein hoher und ein tieferer, einige Male pro Sekunde.

## Warum es funktioniert

Der Ausgang des langsamen OPV-Oszillators springt zwischen hoch und tief. Über einen Spannungsteiler und einen Spannungsfolger wird daraus eine von zwei Spannungen, 7,1 V oder 4,2 V, die die Basiswiderstände des Tongenerators speisen. Je höher die Spannung, desto schneller erholen sich die Kondensatoren des Multivibrators, und desto höher der Ton.
