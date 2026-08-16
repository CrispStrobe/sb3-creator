---
level: advanced
age: 14+
prereqs: [51-555-astable, pc48-ldr-comparator]
teaches: [555-timer, LDR, light-controlled-frequency]
---
## Was du siehst
Ein LDR steuert die Blinkfrequenz eines 555-Astable: bei Helligkeit blinkt die LED schnell (LDR niederohmig → kurze Zeitkonstante), bei Dunkelheit langsam (LDR hochohmig → lange Zeitkonstante).

## Probier das
1. Klick auf **Sim** — die LED blinkt.
2. Ändere den LDR-Wert: hell → schnelles Blinken, dunkel → langsames Blinken.
3. Die Blinkrate ändert sich stufenlos mit der Helligkeit.

## Was passiert hier
Der LDR ersetzt den R₂ des 555-Astable. Die Frequenz f = 1,44 / ((R₁ + 2·R_LDR) × C) hängt direkt vom LDR-Widerstand ab. Da der LDR-Bereich typisch 1 kΩ (hell) bis 100 kΩ (dunkel) beträgt, ändert sich die Frequenz um den Faktor ~100.

## Weiter geht's
- [51-555-astable](../51-555-astable) — 555-Astable mit fester Frequenz.
- [pc72-tagschaltung](../pc72-tagschaltung) — LDR steuert einen Transistor statt einen Timer.
