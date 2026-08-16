---
level: intermediate
age: 12+
prereqs: [51-555-astable]
teaches: [555-timer, CD4017, decade-counter, LED-chaser, sequential-logic]
---
## Was du siehst
Ein LED-Lauflicht: zehn LEDs leuchten nacheinander im Kreis, angetrieben von einem 555-Timer und einem CD4017-Dekadenzähler. Immer nur eine LED leuchtet — die anderen sind dunkel.

## Probier das
1. Klick auf **Sim** — die LEDs laufen im Kreis, eine nach der anderen.
2. Die Geschwindigkeit bestimmt der 555-Timer: R₁=1 kΩ, R₂=47 kΩ, C=10 µF → f ≈ 1,5 Hz.
3. Jeder Taktimpuls schaltet den Zähler einen Ausgang weiter: q0 → q1 → ... → q9 → q0.

## Was passiert hier
Der 555 erzeugt ein Rechtecksignal, das den Takteingang des CD4017 treibt. Der CD4017 ist ein Dekadenzähler: bei jedem Taktimpuls geht genau ein Ausgang (q0–q9) auf High, alle anderen bleiben Low. Nach q9 beginnt der Zähler von vorn.

## Weiter geht's
- [pc82-mini-roulette](../pc82-mini-roulette) — gleiches Prinzip, aber mit Verlangsamung.
- [51-555-astable](../51-555-astable) — der Taktgeber allein.
