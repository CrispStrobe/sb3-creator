---
level: advanced
age: 14+
prereqs: [pc70-schmitt-trigger, lab-diff-pair]
teaches: [schmitt-trigger, hysteresis, emitter-coupled, latch, clap-switch]
---
## Was du siehst
Zwei Transistoren mit einem gemeinsamen Emitterwiderstand, eine gelbe LED, ein Empfindlichkeitsregler und zwei Taster: **Klatschen** (er ersetzt den Schallimpuls eines Mikrofons) und **Reset**.

## Probier das
1. Klick auf **Sim**: die LED ist dunkel.
2. Drück **Klatschen**: die LED geht an und bleibt an, auch wenn du loslässt.
3. Drück **Reset**: wieder dunkel.
4. Dreh die Empfindlichkeit hoch Richtung 0,4 und klatsch noch einmal. Das Licht hält nicht mehr.

## Was passiert hier
Die beiden Transistoren teilen sich den Emitterwiderstand, deshalb hebt der jeweils leitende Transistor die Emitterspannung an – und die bestimmt, ab wann der andere übernehmen darf. Leitet q1, liegt der Emitter tiefer als wenn q2 leitet. Der Regler setzt q1s Basis zwischen diese beiden Schwellen. Ein Klatschimpuls zieht q1 kurz unter die untere Schwelle, q2 übernimmt den Strom und hebt den Emitter an; ist der Impuls vorbei, steht q1s Basis wieder dort, wo sie war, aber das reicht jetzt nicht mehr gegen den angehobenen Emitter. Der Trigger merkt sich das Klatschen. Reset schiebt q1 andersherum über die obere Schwelle.

## Weiter geht's
- [pc70-schmitt-trigger](../pc70-schmitt-trigger) — dieselbe Idee mit einem Logikgatter.
- [lab-diff-pair](../lab-diff-pair) — der gemeinsame Emitterwiderstand ohne Rückkopplung.
