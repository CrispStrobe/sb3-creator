---
level: advanced
age: 15+
prereqs: [lab-opamp-gain, pc50-two-stage-rc]
teaches: [phase-shift-oscillator, barkhausen-criterion, RC-phase, sine-oscillator, feedback]
---
## Was du siehst
Ein Verstärker, der sein Signal umdreht und es sich über drei Widerstand-Kondensator-Paare selbst wieder zuführt. Dreh den GAIN-Knopf über einen bestimmten Punkt, und er beginnt einen gleichmäßigen Ton von etwa 650 Hz zu singen; darunter bleibt er still.

## Probier das
1. Starte die Simulation mit GAIN auf 50 % und beobachte den Ausgang auf dem Oszilloskop. Ein winziges Zittern wächst innerhalb weniger zehn Millisekunden zu einer vollen Welle.
2. Dreh GAIN auf 10 % und starte neu. Das Zittern klingt stattdessen ab.
3. Such die Stellung, bei der es gerade noch weiterläuft. Rechne dort R_f / R3 aus: Es sollte nahe bei 29 liegen.
4. Dreh GAIN ganz auf und sieh dir die Wellenform an. Die Spitzen werden flach, weil dem Verstärker die Spannung ausgeht.

## Was dahintersteckt
Jedes RC-Paar verzögert das Signal ein wenig. Bei einer bestimmten Frequenz verzögern die drei Paare es zusammen um einen halben Schwingungszug (180°), und der Verstärker, der invertiert, fügt noch einen halben hinzu. Das Signal kommt genau im Gleichtakt mit sich selbst am Eingang an und verstärkt sich, aber nur bei dieser Frequenz. Auf dem Weg durch die drei Paare schrumpft es außerdem auf ein Neunundzwanzigstel, also muss der Verstärker mindestens 29-fach verstärken. Weniger, und das Klingen erstirbt; mehr, und es wächst, bis die Grenzen des Verstärkers es bremsen. Dieses Gleichgewicht (im Takt, und mindestens Verstärkung eins rund um die Schleife) ist das Rezept jedes Sinusoszillators.

## Weiter geht's
- [lab-opamp-blinker](../lab-opamp-blinker): ein Oszillator, der zwischen zwei Zuständen kippt, statt einen Sinus zu erzeugen.
- [pc50-two-stage-rc](../pc50-two-stage-rc): RC-Glieder und was sie mit einem Signal machen.
