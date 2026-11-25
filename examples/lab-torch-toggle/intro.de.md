# Flipflop, mit der Taschenlampe umgeschaltet

**Vermittelt:** Flipflop, Flankensteuerung, Fototransistor

## Was zu tun ist

Klick auf **Sim**: Die grüne LED leuchtet. Schieb den Lichtregler des Fototransistors (phototransistor_11) hoch, als ob du mit einer Taschenlampe darauf leuchtest, dann wieder auf dunkel. Wiederhole das.

## Was du sehen solltest

- Jeder Lichtblitz tauscht die LEDs: Grün, Rot, Grün …
- Der Zustand bleibt, wenn das Licht weg ist.

## Warum es funktioniert

Licht schaltet den kleinen Transistor neben dem Fototransistor ein und zieht die Triggerleitung nach unten. Dieser plötzliche Abfall gelangt über zwei kleine Kondensatoren zu beiden Hälften des Flipflops, aber eine Diode lässt ihn nur zu der Hälfte durch, die gerade leitet. Diese Hälfte schaltet ab, die andere übernimmt, und die Überkreuz-Verdrahtung hält sie dort bis zum nächsten Blitz.
