---
level: intermediate
age: 12+
prereqs: [pc05-npn-switch]
teaches: [flip-flop, positive-feedback, set-reset, memory]
---
## Was du siehst
Zwei Transistoren, eine rote und eine grüne LED, zwei Taster. Nach dem Einschalten leuchtet Grün. Ein Druck auf SET macht Rot an — und Rot bleibt, auch wenn du loslässt. RESET holt Grün zurück.

## Probier das
1. Klick auf **Sim**: Grün leuchtet.
2. Drück kurz **SET**. Rot an, Grün aus. Loslassen ändert nichts.
3. Noch einmal **SET**: weiter Rot. Die Schaltung „weiß" es schon.
4. **RESET** drücken: wieder Grün.
5. Halte beide Taster und lass einen zuerst los. Welche LED gewinnt?

## Was passiert hier
Der Kollektor jedes Transistors steuert die Basis des anderen. Leitet Q1, ist sein Kollektor tief, Q2 bekommt keinen Basisstrom und sperrt; Q2s Kollektor ist dann hoch und versorgt Q1 weiter. Diese Schleife hält sich selbst — Mitkopplung. Ein Taster muss sie nur kurz unterbrechen, dann kippt sie in den anderen stabilen Zustand. Das ist ein Bit Speicher, dieselbe Idee wie eine Zelle im statischen RAM.

## Weiter geht's
- [pc59-nor-memory](../pc59-nor-memory) — derselbe Speicher aus Logikgattern.
- [pc05-npn-switch](../pc05-npn-switch) — ein Transistor als Schalter.
