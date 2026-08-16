---
level: intermediate
age: 12+
prereqs: [pc67-555-tongenerator]
teaches: [555-timer, astable, siren, pitch-control]
---
## Was du siehst
Ein 555-Sirenenkreis: ein Potentiometer steuert die Tonhöhe von tiefem Brummen bis hohem Pfeifen. R₁ = 1 kΩ, Poti bis 47 kΩ, C = 100 nF.

## Probier das
1. Klick auf **Sim** — der Summer erzeugt einen Ton.
2. Drehe das Poti — die Tonhöhe ändert sich stufenlos.
3. Poti voll aufgedreht → hoher Ton. Zurückgedreht → tiefer Ton.

## Was passiert hier
Das Potentiometer ersetzt den festen R₂ des Tongenerators. Die Frequenz f = 1,44 / ((R₁ + 2·R_pot) × C) ändert sich mit der Poti-Stellung. Das ergibt eine stufenlos regelbare Sirene.

## Weiter geht's
- [pc67-555-tongenerator](../pc67-555-tongenerator) — feste Frequenz ohne Poti.
- [pc65-555-metronom](../pc65-555-metronom) — niedrige Frequenz als Metronom.
