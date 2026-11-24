---
level: advanced
age: 14+
prereqs: [lab-pnp-npn-relax]
teaches: [relaxation-oscillator, tone-generator, sawtooth, pitch]
---
## Was du siehst
Der PNP-NPN-Blitzer, diesmal mit einem winzigen 47-nF-Kondensator statt eines Elkos und mit einem Piezo-Hörer, wo vorher die LED saß. Ein Stellwiderstand bestimmt, wie schnell sich der Kondensator lädt.

## Probier das
1. Klick auf **Sim** und hör hin: ein schnarrender Ton.
2. Dreh am Stellwiderstand. In welche Richtung wird der Ton höher?
3. Halte einen Tastkopf an den Kondensator: dieselbe Sägezahnkurve wie beim Blitzer, nur tausendmal schneller.
4. Halte den Tastkopf an den Piezo. Während der Kondensator lädt, sieht er nichts – und jedes Mal, wenn das Paar zündet, eine kurze Spitze.

## Was passiert hier
An der Schaltung hat sich nur die Größe des Kondensators geändert. Er lädt sich weiterhin über die Widerstände auf, bis er die Basisspannung des PNP überschreitet; dann zündet das Paar, leert ihn in einem kurzen Impuls, und das Laden beginnt von vorn. Mit einem hundertmal kleineren Kondensator ist jeder Durchgang hundertmal kürzer, und ein paar hundert Klicks pro Sekunde verschwimmen zu einem Ton. Weniger Widerstand heißt schnelleres Laden und einen höheren Ton. Die steilen Impulse machen den Klang rau und schnarrend: Ein Sägezahn steckt voller Obertöne.

## Weiter geht's
- [lab-battery-monitor](../lab-battery-monitor) — dasselbe Paar als Batteriewächter mit einstellbarer Schwelle.
- [lab-astable-tone](../lab-astable-tone) — ein Ton aus dem Zwei-Transistor-Multivibrator.
