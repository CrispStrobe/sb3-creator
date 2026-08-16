---
level: intermediate
age: 12+
prereqs: [51-555-astable]
teaches: [555-timer, astable, audio, frequency]
---
## Was du siehst
Ein 555-Timer als Tongenerator. R₁ = 1 kΩ, R₂ = 10 kΩ, C = 100 nF erzeugen eine Frequenz von f = 1,44 / ((1k + 2·10k) × 100n) ≈ 686 Hz — ein gut hörbarer Ton.

## Probier das
1. Klick auf **Sim** — der Summer erzeugt einen konstanten Ton (~686 Hz).
2. Die Frequenz ist fest — sie hängt nur von R₁, R₂ und C ab.

## Was passiert hier
Im astabilen Modus schwingt der 555 zwischen Laden (über R₁ + R₂) und Entladen (über R₂ allein). Bei kleinem C und moderaten Widerständen liegt die Frequenz im Hörbereich. Das Tastverhältnis ist asymmetrisch: t_high = 0,693 × (R₁+R₂) × C, t_low = 0,693 × R₂ × C.

## Weiter geht's
- [pc68-555-sirene](../pc68-555-sirene) — gleiche Schaltung mit Poti für variable Tonhöhe.
- [51-555-astable](../51-555-astable) — niedrige Frequenz zum Sehen statt Hören.
