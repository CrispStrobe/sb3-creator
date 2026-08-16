---
level: advanced
age: 14+
prereqs: [pc82-mini-roulette]
teaches: [tilt-sensor, shake-trigger, 555-timer, CD4017, game]
---
## Was du siehst
Ein Glücksrad: schüttle das Gerät (Neigungssensor) und die LEDs rasen los. Die Schüttelbewegung startet den 555-Timer, der das Lauflicht antreibt. Wenn der Sensor zur Ruhe kommt, verlangsamt sich das Rad und stoppt auf einer Position. Sechs LED-Segmente, Rücksetzen nach q6.

## Probier das
1. Aktiviere den Neigungssensor — die LEDs laufen los.
2. Sensor beruhigt sich → Lauflicht verlangsamt und stoppt.
3. Die Stoppposition ist unvorhersehbar — abhängig von Schütteldauer und RC-Abklingzeit.

## Was passiert hier
Der Neigungssensor liegt am Reset-Pin des 555. Schütteln erzeugt kurze High-Impulse, die den Timer freigeben. Das RC-Glied am Control-Pin bremst den Oszillator, sobald der Sensor ruhig wird. Der CD4017 zählt nur bis q5 (q6 löst den Reset aus → 6-Positionen-Rad).

## Weiter geht's
- [pc82-mini-roulette](../pc82-mini-roulette) — Taster-Version des gleichen Prinzips.
