---
level: intermediate
age: 12+
prereqs: [pc05-npn-switch, pc48-ldr-comparator]
teaches: [LDR, transistor-switch, voltage-divider, light-sensor]
---
## Was du siehst
Eine Tagschaltung: die LED leuchtet nur bei Helligkeit. Ein lichtabhängiger Widerstand (LDR) steuert einen NPN-Transistor — bei Licht sinkt der LDR-Widerstand, mehr Basisstrom fließt, der Transistor schaltet durch.

## Probier das
1. Klick auf **Sim** — bei hellem LDR-Wert leuchtet die LED.
2. Ändere den LDR-Wert (dunkel) — die LED erlischt.
3. Vergleiche mit der [Nachtschaltung](../pc73-nachtschaltung), wo die LED bei Dunkelheit leuchtet.

## Was passiert hier
LDR und Festwiderstand bilden einen Spannungsteiler. Bei Helligkeit ist der LDR niederohmig, die Spannung am Teilerpunkt steigt über die Basis-Emitter-Schwelle des Transistors (~0,7 V), und der Transistor schaltet die LED ein.

## Weiter geht's
- [pc73-nachtschaltung](../pc73-nachtschaltung) — die komplementäre Schaltung (LED bei Dunkelheit).
- [pc48-ldr-comparator](../pc48-ldr-comparator) — LDR mit Komparator statt Transistor.
