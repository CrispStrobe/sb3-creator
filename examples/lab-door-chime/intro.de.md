# Ladentür-Gong

Geht die Tür auf, ertönt kurz ein Gong und verstummt dann von selbst. Zwei Transistoren bestimmen die Dauer, ein dritter schaltet den Tongenerator ein und aus.

**Vermittelt:** Monoflop, feste Impulslänge, Tongenerator torgesteuert

## Was zu tun ist

Klick auf **Sim**. Drück kurz die Taste TÜR (button_12) und hör hin. Drück sie noch einmal, diesmal etwas länger.

## Was du sehen solltest

- Jeder Druck startet einen Ton von etwa 280 Hz, der etwa eine Drittelsekunde dauert.
- Ein kurzes Tippen und ein etwas längerer Druck ergeben denselben Gong.

## Warum es funktioniert

In Ruhe ist ein Transistor des Paars leitend und der andere gesperrt, und der hohe Kollektor des gesperrten hält einen dritten Transistor leitend, der den Tongenerator stumm hält. Ein Druck kippt das Paar; der Kondensator zwischen beiden hält es gekippt, bis er sich wieder aufgeladen hat, und das dauert immer gleich lang. Solange das Paar gekippt ist, sperrt der dritte Transistor, und der Tongenerator läuft.
