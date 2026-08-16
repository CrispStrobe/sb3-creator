---
level: intermediate
age: 12+
prereqs: [51-555-astable]
teaches: [555-timer, low-duty-cycle, strobe, flash]
---
## Was du siehst
Ein Stroboskop: eine helle weiße LED blitzt kurz auf, dann ist es lange dunkel. Der 555-Timer im Astable-Modus erzeugt ein Signal mit sehr kleinem Tastverhältnis — kurzer High-Puls, lange Low-Phase.

## Probier das
1. Klick auf **Sim** — die LED blitzt rhythmisch auf.
2. R₁ = 1 kΩ (kurze Ladezeit → kurzer Blitz), R₂ = 100 kΩ (lange Entladezeit → lange Pause).
3. Tastverhältnis ≈ (R₁)/(R₁+2·R₂) ≈ 0,5 % — die LED ist 99,5 % der Zeit dunkel.

## Was passiert hier
Im normalen 555-Astable laden R₁+R₂ den Kondensator (High-Phase), R₂ allein entlädt ihn (Low-Phase). Wenn R₁ << R₂, ist die Ladezeit viel kürzer als die Entladezeit — ein schmaler High-Puls entsteht. Der 100-Ω-Vorwiderstand sorgt für hellen Blitz (I ≈ 30 mA im Puls).

## Weiter geht's
- [pc67-555-tongenerator](../pc67-555-tongenerator) — 555-Astable im Audiobereich.
- [51-555-astable](../51-555-astable) — symmetrischeres Blinken.
