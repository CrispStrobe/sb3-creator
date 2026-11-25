# Kipp-Flipflop mit Steuerdioden und Münzwurf

Eine Taste, zwei Zustände: Jeder Druck schaltet ein Transistorpaar von Rot auf Grün oder zurück. Lässt du einen schnellen Oszillator die Taste drücken, solange du TOSS hältst, hast du eine elektronische Münze.

**Vermittelt:** T-Flipflop, Steuerdioden, Teilen durch zwei, Zufall durch Timing

## Was zu tun ist

Klick auf **Sim**. Drück ein paarmal die STEP-Taste (button_15, beim Flipflop). Halte dann die TOSS-Taste (button_30, beim Verstärker-Chip) kurz gedrückt und lass los.

## Was du sehen solltest

- Jeder Druck auf STEP tauscht Rot und Grün.
- Solange TOSS gedrückt ist, flackern beide LEDs; beim Loslassen bleibt eine an — welche, kann man nicht vorhersagen.

## Warum es funktioniert

Jede fallende Flanke auf der Triggerleitung versucht, beide Basen herunterzuziehen, aber nur eine Diode lässt sie durch: die auf der Seite, deren Kollektor tief liegt, also beim leitenden Transistor. Schaltet der ab, übernimmt der andere. Der Oszillator macht 55 solche Flanken pro Sekunde, also hängt der Endzustand davon ab, wie lange du die Taste gehalten hast, auf eine Hundertstelsekunde genau.
