---
level: intermediate
age: 12+
prereqs: [pc72-tagschaltung]
teaches: [LDR, transistor-switch, voltage-divider, night-light]
---
## Was du siehst
Eine Nachtschaltung: die LED leuchtet bei Dunkelheit. LDR und Festwiderstand sind gegenüber der Tagschaltung vertauscht — bei Dunkelheit wird der LDR hochohmig, die Spannung am Teilerpunkt steigt, und der Transistor schaltet die LED ein.

## Probier das
1. Klick auf **Sim** — bei dunklem LDR-Wert leuchtet die LED.
2. Ändere den LDR-Wert (hell) — die LED erlischt.
3. Der einzige Unterschied zur [Tagschaltung](../pc72-tagschaltung) ist die Position von LDR und Widerstand im Spannungsteiler.

## Was passiert hier
Im Spannungsteiler sitzt der Festwiderstand oben (VCC-seitig) und der LDR unten (GND-seitig). Bei Dunkelheit ist der LDR hochohmig, fast die gesamte Spannung fällt am LDR ab, der Teilerpunkt liegt hoch, und der Transistor schaltet durch.

## Weiter geht's
- [pc72-tagschaltung](../pc72-tagschaltung) — die komplementäre Schaltung (LED bei Helligkeit).
- [pc60-night-lamp-hardware](../pc60-night-lamp-hardware) — ein weiteres Hardware-Nachtlicht.
