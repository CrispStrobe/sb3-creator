---
level: intermediate
age: 12+
prereqs: [pc77-klemmenspannung]
teaches: [loaded-source, voltage-sag, internal-resistance, battery]
---
## Was du siehst
Eine Batterie (9 V, 2 Ω Innenwiderstand) versorgt zwei parallele Lastpfade: einen leichten (1 kΩ) und einen schweren (100 Ω). Beide haben eine LED als Anzeige. Der schwere Lastpfad zieht mehr Strom und verursacht einen stärkeren Spannungseinbruch.

## Probier das
1. Leichter Pfad allein: I = 9 / (2 + 1000) ≈ 9 mA. V_klemme ≈ 8,98 V. LED leuchtet hell.
2. Schwerer Pfad allein: I = 9 / (2 + 100) ≈ 88 mA. V_klemme ≈ 8,82 V. LED etwas dunkler.
3. Beide Pfade: der Gesamtstrom steigt, die Klemmenspannung sinkt weiter.

## Was passiert hier
Der Innenwiderstand der Batterie wirkt wie ein Vorwiderstand für alle Verbraucher zusammen. Je mehr Gesamtstrom fließt, desto mehr Spannung „verschwindet" im Innenwiderstand, und desto weniger Spannung steht den LEDs zur Verfügung.

## Weiter geht's
- [pc77-klemmenspannung](../pc77-klemmenspannung) — Leerlauf vs Klemmenspannung.
- [pc80-quellen-vergleich](../pc80-quellen-vergleich) — zwei Batterien mit unterschiedlichem Innenwiderstand.
